import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dices,
  RotateCcw,
  Trophy,
  Sparkles,
  Loader2,
  Medal,
} from "lucide-react";
import {
  fetchSlotsState,
  upsertSlotsState,
  updateProfileStats,
  fetchProfile,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

const SYMBOLS = [
  { emoji: "📚", label: "Книга", weight: 30 },
  { emoji: "⚗️", label: "Колба", weight: 25 },
  { emoji: "📐", label: "Линейка", weight: 20 },
  { emoji: "🎓", label: "Диплом", weight: 15 },
  { emoji: "🔥", label: "Огонь", weight: 7 },
  { emoji: "💰", label: "Стипендия", weight: 3 },
];

const PAYOUTS: Record<string, number> = {
  "💰": 100,
  "🔥": 50,
  "🎓": 25,
  "📐": 15,
  "⚗️": 10,
  "📚": 5,
};

const PRESTIGE_COST = 1_000_000_000;

interface ReelState {
  symbol: (typeof SYMBOLS)[0];
  spinning: boolean;
}

interface HistoryItem {
  win: number;
  symbols: string;
}

function pickWeighted(): (typeof SYMBOLS)[0] {
  const total = SYMBOLS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const symbol of SYMBOLS) {
    random -= symbol.weight;

    if (random <= 0) {
      return symbol;
    }
  }

  return SYMBOLS[0];
}

function getPrestigeMedal(prestige: number) {
  if (prestige >= 1000) return "♾️";
  if (prestige >= 500) return "👑";
  if (prestige >= 100) return "💎";
  if (prestige >= 50) return "🔥";
  if (prestige >= 25) return "🏆";
  if (prestige >= 10) return "🥇";
  if (prestige >= 5) return "🥈";
  if (prestige >= 1) return "🥉";

  return "🏅";
}

function convertToPrestige(balance: number, prestige: number) {
  if (balance < PRESTIGE_COST) {
    return {
      balance,
      prestige,
      gained: 0,
    };
  }

  const gained = Math.floor(balance / PRESTIGE_COST);

  return {
    balance: balance % PRESTIGE_COST,
    prestige: prestige + gained,
    gained,
  };
}

export default function SlotsView() {
  const [reels, setReels] = useState<ReelState[]>([
    {
      symbol: SYMBOLS[0],
      spinning: false,
    },
    {
      symbol: SYMBOLS[1],
      spinning: false,
    },
    {
      symbol: SYMBOLS[2],
      spinning: false,
    },
  ]);

  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [prestige, setPrestige] = useState(0);
  const [bet, setBet] = useState(50);

  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalWon, setTotalWon] = useState(0);
  const [spins, setSpins] = useState(0);

  const spinTimers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    loadState();

    return () => {
      spinTimers.current.forEach(clearInterval);
    };
  }, []);

  async function loadState() {
    try {
      const state = await fetchSlotsState();

      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const profile = await fetchProfile(user.id);

      if (state) {
        let loadedBalance = Number(state.balance) || 0;

        const loadedPrestige =
          Number((state as any).prestige) || 0;

        /*
         * Если в базе ещё остался старый баланс
         * больше 1 миллиарда — автоматически
         * переводим его в престиж.
         */
        const converted = convertToPrestige(
          loadedBalance,
          loadedPrestige
        );

        loadedBalance = converted.balance;

        setBalance(loadedBalance);
        setPrestige(converted.prestige);

        const savedBet = Number(state.bet) || 50;

        setBet(
          loadedBalance >= 10
            ? Math.min(
                loadedBalance,
                Math.max(10, savedBet)
              )
            : 10
        );

        setHistory(state.history || []);

        /*
         * Если обнаружили старый огромный баланс,
         * сразу сохраняем новую структуру.
         */
        if (converted.gained > 0) {
          const { error } = await supabase
            .from("slots_state")
            .update({
              balance: converted.balance,
              prestige: converted.prestige,
            })
            .eq("user_id", user.id);

          if (error) {
            console.error(
              "Ошибка сохранения престижа:",
              error
            );
          }
        }
      }

      if (profile) {
        setTotalWon(Number(profile.total_won) || 0);
        setSpins(Number(profile.spins) || 0);
      }
    } catch (error) {
      console.error(
        "Ошибка загрузки слотов:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveState(
    newBalance: number,
    newBet: number,
    newHistory: HistoryItem[],
    won: number,
    newPrestige: number
  ) {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) return;

      /*
       * Баланс всегда хранится отдельно от престижа.
       *
       * Например:
       *
       * 2 100 351 430
       *
       * превращается в:
       *
       * balance  = 100 351 430
       * prestige = 2
       */
      const { error: slotsError } = await supabase
        .from("slots_state")
        .upsert(
          {
            user_id: user.id,
            balance: newBalance,
            bet: newBet,
            history: newHistory,
            prestige: newPrestige,
          },
          {
            onConflict: "user_id",
          }
        );

      if (slotsError) {
        console.error(
          "Ошибка сохранения slots_state:",
          slotsError
        );

        return;
      }

      const newSpins = spins + 1;
      const newTotalWon = totalWon + won;

      setSpins(newSpins);
      setTotalWon(newTotalWon);

      /*
       * ВАЖНО:
       * Старый max_balance больше НЕ используется
       * как рекорд для рейтинга.
       *
       * Сохраняем туда текущий нормализованный баланс,
       * чтобы старые миллиарды не возвращались.
       */
      const { error: profileError } =
        await updateProfileStats(
          newBalance,
          newTotalWon,
          newSpins
        );

      if (profileError) {
        console.error(
          "Ошибка обновления статистики:",
          profileError
        );
      }
    } catch (error) {
      console.error(
        "Ошибка сохранения слотов:",
        error
      );
    }
  }

  const spin = useCallback(() => {
    if (
      spinning ||
      balance < bet ||
      bet < 10
    ) {
      return;
    }

    setSpinning(true);
    setLastWin(null);
    setWinMessage(null);

    const finalSymbols = [
      pickWeighted(),
      pickWeighted(),
      pickWeighted(),
    ];

    for (let i = 0; i < 3; i++) {
      const interval = setInterval(() => {
        setReels((previous) => {
          const copy = [...previous];

          copy[i] = {
            symbol: pickWeighted(),
            spinning: true,
          };

          return copy;
        });
      }, 80);

      spinTimers.current.push(interval);

      setTimeout(() => {
        clearInterval(interval);

        spinTimers.current =
          spinTimers.current.filter(
            (timer) => timer !== interval
          );

        setReels((previous) => {
          const copy = [...previous];

          copy[i] = {
            symbol: finalSymbols[i],
            spinning: false,
          };

          return copy;
        });

        if (i === 2) {
          setTimeout(() => {
            setSpinning(false);

            const all = finalSymbols;

            const allMatch =
              all[0].emoji === all[1].emoji &&
              all[1].emoji === all[2].emoji;

            const twoMatch =
              all[0].emoji === all[1].emoji ||
              all[1].emoji === all[2].emoji ||
              all[0].emoji === all[2].emoji;

            let win = 0;
            let message: string | null = null;

            if (allMatch) {
              win =
                bet *
                (PAYOUTS[all[0].emoji] ?? 5);

              if (all[0].emoji === "💰") {
                message =
                  "ДЖЕКПОТ! Стипендия получена!";
              } else if (all[0].emoji === "🔥") {
                message = "Огненный выигрыш!";
              } else {
                message = `Три в ряд! +${win}`;
              }
            } else if (twoMatch) {
              const matchSymbol =
                all[0].emoji === all[1].emoji
                  ? all[0]
                  : all[1].emoji === all[2].emoji
                    ? all[1]
                    : all[0];

              win = Math.floor(
                bet *
                  (PAYOUTS[matchSymbol.emoji] ?? 5) *
                  0.3
              );

              message = `Пара! +${win}`;
            }

            /*
             * Сначала считаем обычный результат.
             */
            const rawBalance =
              balance - bet + win;

            /*
             * Затем проверяем престиж.
             */
            const converted = convertToPrestige(
              rawBalance,
              prestige
            );

            const newBalance = converted.balance;
            const newPrestige = converted.prestige;

            setBalance(newBalance);
            setPrestige(newPrestige);

            if (win > 0) {
              setLastWin(win);
              setWinMessage(message);
            } else {
              setLastWin(0);
            }

            /*
             * Если игрок перешёл миллиард —
             * показываем сообщение о престиже.
             */
            if (converted.gained > 0) {
              setWinMessage(
                converted.gained === 1
                  ? "🏅 НОВЫЙ ПРЕСТИЖ! +1"
                  : `🏅 НОВЫЙ ПРЕСТИЖ! +${converted.gained}`
              );
            }

            const newHistory: HistoryItem[] = [
              {
                win,
                symbols: all
                  .map((symbol) => symbol.emoji)
                  .join(""),
              },
              ...history.slice(0, 9),
            ];

            setHistory(newHistory);

            saveState(
              newBalance,
              bet,
              newHistory,
              win,
              newPrestige
            );
          }, 150);
        }
      }, 600 + i * 400);
    }
  }, [
    spinning,
    balance,
    bet,
    history,
    totalWon,
    spins,
    prestige,
  ]);

  const handleBetChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    if (value === "") {
      setBet(0);
      return;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return;
    }

    setBet(
      Math.min(
        balance,
        Math.max(10, Math.floor(number))
      )
    );
  };

  const canSpin =
    !spinning &&
    bet >= 10 &&
    bet <= balance &&
    balance >= bet;

  const progress = Math.min(
    100,
    (balance / PRESTIGE_COST) * 100
  );

  const remainingToPrestige =
    PRESTIGE_COST - balance;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* БАЛАНС + ПРЕСТИЖ */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-teal-100 text-xs font-medium">
              Баланс
            </p>

            <p className="text-3xl font-bold mt-0.5">
              {balance.toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>

        </div>

        {/* ПРЕСТИЖ */}
        <div className="mt-4 bg-white/10 rounded-xl p-3">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-xl">
                {getPrestigeMedal(prestige)}
              </div>

              <div>
                <p className="text-xs text-teal-100">
                  Престиж
                </p>

                <p className="text-base font-bold">
                  ×{prestige.toLocaleString("ru-RU")}
                </p>
              </div>

            </div>

            <Medal className="w-5 h-5 text-white/70" />

          </div>

          {/* ПРОГРЕСС */}
          <div className="mt-3">

            <div className="flex items-center justify-between mb-1">

              <span className="text-[11px] text-teal-100">
                До следующего
              </span>

              <span className="text-[11px] text-teal-100">
                {Math.round(progress)}%
              </span>

            </div>

            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">

              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <p className="text-[10px] text-teal-100 mt-1.5 text-right">
              {remainingToPrestige.toLocaleString("ru-RU")} ₽
            </p>

          </div>

        </div>

        <div className="flex gap-3 mt-3">

          {lastWin !== null && lastWin > 0 && (
            <div className="bg-white/20 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">

              <Sparkles className="w-4 h-4 text-yellow-300" />

              <span className="text-sm font-medium">
                +{lastWin} ₽
              </span>

            </div>
          )}

          <div className="bg-white/10 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">

            <span className="text-xs text-teal-100">
              Медаль: {getPrestigeMedal(prestige)}
            </span>

          </div>

        </div>

      </div>

      {/* СЛОТЫ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        <div className="bg-gray-900 rounded-xl p-4 mb-4">

          <div className="flex items-center justify-center gap-2">

            {reels.map((reel, index) => (
              <div
                key={index}
                className={`flex-1 aspect-square max-w-[80px] bg-white rounded-xl flex items-center justify-center text-4xl transition-all ${
                  reel.spinning
                    ? "scale-90 opacity-70"
                    : "scale-100 opacity-100"
                }`}
              >
                <span
                  className={
                    reel.spinning
                      ? "animate-pulse"
                      : ""
                  }
                >
                  {reel.symbol.emoji}
                </span>
              </div>
            ))}

          </div>

        </div>

        {winMessage && (
          <div className="text-center mb-3">
            <p className="text-sm font-bold text-teal-600 animate-pulse">
              {winMessage}
            </p>
          </div>
        )}

        {/* СТАВКА */}
        <div className="flex items-center justify-between mb-3">

          <span className="text-xs font-medium text-gray-500">
            Ставка
          </span>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setBet((current) =>
                  Math.max(10, current - 10)
                )
              }
              disabled={spinning}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold flex items-center justify-center disabled:opacity-40"
            >
              −
            </button>

            <input
              type="number"
              inputMode="numeric"
              min="10"
              max={balance}
              step="1"
              value={bet === 0 ? "" : bet}
              onChange={handleBetChange}
              disabled={spinning}
              aria-label="Сумма ставки"
              className="text-sm font-bold text-gray-900 w-16 h-8 text-center bg-gray-50 rounded-lg px-1 outline-none border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-40"
            />

            <span className="text-sm font-bold text-gray-900">
              ₽
            </span>

            <button
              onClick={() =>
                setBet((current) =>
                  Math.min(
                    balance,
                    Math.max(10, current + 10)
                  )
                )
              }
              disabled={spinning}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold flex items-center justify-center disabled:opacity-40"
            >
              +
            </button>

          </div>

        </div>

        <button
          onClick={spin}
          disabled={!canSpin}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
            canSpin
              ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-md shadow-teal-200 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >

          <Dices
            className={`w-5 h-5 ${
              spinning ? "animate-spin" : ""
            }`}
          />

          {spinning ? "Крутим..." : "Крутить"}

        </button>

        {balance < bet && !spinning && (
          <p className="text-center text-xs text-red-500 mt-2">
            Не хватает баланса на ставку
          </p>
        )}

        {bet > 0 && bet < 10 && !spinning && (
          <p className="text-center text-xs text-red-500 mt-2">
            Минимальная ставка — 10 ₽
          </p>
        )}

      </div>

      {/* ВЫПЛАТЫ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">

        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Выплаты (3 в ряд)
        </h3>

        <div className="grid grid-cols-3 gap-2">

          {SYMBOLS.map((symbol) => (
            <div
              key={symbol.emoji}
              className="flex flex-col items-center bg-gray-50 rounded-lg py-2"
            >

              <span className="text-2xl mb-1">
                {symbol.emoji}
              </span>

              <span className="text-xs font-bold text-gray-700">
                ×{PAYOUTS[symbol.emoji] ?? 5}
              </span>

            </div>
          ))}

        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          Пара символов = 30% от выплаты
        </p>

      </div>

      {/* ИСТОРИЯ */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">

          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            История
          </h3>

          <div className="space-y-1.5">

            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >

                <span className="text-lg">
                  {item.symbols}
                </span>

                <span
                  className={
                    item.win > 0
                      ? "text-teal-600 font-medium"
                      : "text-gray-400"
                  }
                >
                  {item.win > 0
                    ? `+${item.win} ₽`
                    : "—"}
                </span>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* ПОПОЛНЕНИЕ */}
      {balance < bet && (
        <button
          onClick={async () => {
            const newBalance = 1000;

            setBalance(newBalance);
            setBet(50);
            setLastWin(null);
            setWinMessage(null);

            const user = (
              await supabase.auth.getUser()
            ).data.user;

            if (user) {
              const { error } = await supabase
                .from("slots_state")
                .upsert(
                  {
                    user_id: user.id,
                    balance: newBalance,
                    bet: 50,
                    history,
                    prestige,
                  },
                  {
                    onConflict: "user_id",
                  }
                );

              if (error) {
                console.error(
                  "Ошибка пополнения баланса:",
                  error
                );
              }
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 text-gray-500 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
        >

          <RotateCcw className="w-4 h-4" />

          Пополнить баланс

        </button>
      )}

    </div>
  );
}
