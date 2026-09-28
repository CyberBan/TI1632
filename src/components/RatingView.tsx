import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Crown,
  Medal,
  Loader2,
} from "lucide-react";

import {
  fetchReactions,
  toggleReaction,
} from "@/lib/api";

import type { SlotReaction } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const REACTION_EMOJIS = [
  "🔥",
  "💰",
  "😂",
  "🤝",
  "💀",
];

interface RatingProfile {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  balance: number;
  prestige: number;
  spins: number;
}

/*
  Значок престижа.

  0  → 🏅
  1+ → 🥉
  5+ → 🥈
  10+ → 🥇
  25+ → 🏆
  50+ → 🔥
  100+ → 💎
  500+ → 👑
  1000+ → ♾️
*/
function getPrestigeMedal(prestige: number): string {
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

export default function RatingView() {
  const [profiles, setProfiles] = useState<RatingProfile[]>([]);
  const [reactions, setReactions] = useState<SlotReaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  /*
    Загружаем рейтинг напрямую из Supabase.

    ВАЖНО:
    здесь используется get_slots_rating(),
    поэтому старый profiles.max_balance
    вообще не используется.
  */
  const loadRating = useCallback(async () => {
    try {
      setError(null);

      const { data, error: ratingError } =
        await supabase.rpc("get_slots_rating");

      if (ratingError) {
        throw ratingError;
      }

      const rating: RatingProfile[] = (data ?? []).map(
        (item: {
          user_id: string;
          display_name: string | null;
          avatar_emoji: string | null;
          balance: number | string | null;
          prestige: number | string | null;
          spins: number | string | null;
        }) => ({
          user_id: item.user_id,

          display_name:
            item.display_name?.trim() || "Без имени",

          avatar_emoji:
            item.avatar_emoji || "🎓",

          balance:
            Number(item.balance ?? 0),

          prestige:
            Number(item.prestige ?? 0),

          spins:
            Number(item.spins ?? 0),
        })
      );

      /*
        Дополнительная сортировка на клиенте.

        Приоритет:
        1. prestige
        2. balance
        3. spins
      */
      rating.sort((a, b) => {
        if (b.prestige !== a.prestige) {
          return b.prestige - a.prestige;
        }

        if (b.balance !== a.balance) {
          return b.balance - a.balance;
        }

        return b.spins - a.spins;
      });

      setProfiles(rating);

      /*
        Реакции отдельно.
        Если реакции не загрузятся, сам рейтинг
        всё равно останется рабочим.
      */
      try {
        const reactionData = await fetchReactions();
        setReactions(reactionData);
      } catch (reactionError) {
        console.error(
          "Ошибка загрузки реакций:",
          reactionError
        );

        setReactions([]);
      }
    } catch (e) {
      console.error(
        "Ошибка загрузки рейтинга:",
        e
      );

      setError(
        e instanceof Error
          ? e.message
          : "Ошибка загрузки рейтинга"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
    Получаем текущего пользователя.
  */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(
        data.user?.id ?? null
      );
    });

    loadRating();

    /*
      Автоматически обновляем рейтинг
      каждые 10 секунд.
    */
    const interval = window.setInterval(() => {
      loadRating();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadRating]);

  /*
    Реакция на игрока.
  */
  async function handleReact(
    targetUserId: string,
    emoji: string
  ) {
    /*
      Нельзя реагировать на самого себя.
    */
    if (targetUserId === currentUserId) {
      return;
    }

    try {
      await toggleReaction(
        targetUserId,
        emoji
      );

      await loadRating();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Ошибка реакции"
      );
    }
  }

  /*
    Количество конкретной реакции.
  */
  function getReactionCount(
    targetUserId: string,
    emoji: string
  ): number {
    return reactions.filter(
      (reaction) =>
        reaction.target_user_id ===
          targetUserId &&
        reaction.emoji === emoji
    ).length;
  }

  /*
    Проверяем, поставил ли текущий пользователь
    эту реакцию.
  */
  function hasReacted(
    targetUserId: string,
    emoji: string
  ): boolean {
    return reactions.some(
      (reaction) =>
        reaction.target_user_id ===
          targetUserId &&
        reaction.emoji === emoji &&
        reaction.reactor_user_id ===
          currentUserId
    );
  }

  /*
    Форматирование денег.

    Например:

    12618475
    ↓
    12 618 475
  */
  function formatMoney(value: number): string {
    return value.toLocaleString("ru-RU");
  }

  /*
    Загрузка.
  */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  /*
    Ошибка.
  */
  if (error) {
    return (
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>

        <button
          onClick={() => {
            setLoading(true);
            loadRating();
          }}
          className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-amber-500" />

        <h3 className="text-sm font-bold text-gray-800">
          Рейтинг богачей
        </h3>
      </div>

      {/* Если игроков нет */}
      {profiles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">

          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />

          <p className="text-gray-400 text-sm">
            Пока никого нет. Крути слоты!
          </p>

        </div>
      ) : (

        <div className="space-y-2.5">

          {profiles.map((profile, index) => {
            const isTop3 = index < 3;

            const isMe =
              profile.user_id === currentUserId;

            const prestigeMedal =
              getPrestigeMedal(
                profile.prestige
              );

            return (
              <div
                key={profile.user_id}
                className={`bg-white rounded-2xl shadow-sm border p-4 transition-all ${
                  isTop3
                    ? "border-amber-200"
                    : "border-gray-100"
                }`}
              >

                {/* Основная информация */}
                <div className="flex items-center gap-3">

                  {/* Место */}
                  <div className="flex-shrink-0 w-8 text-center">

                    {index === 0 ? (
                      <Crown className="w-6 h-6 text-amber-500 mx-auto" />
                    ) : index === 1 ? (
                      <Medal className="w-6 h-6 text-gray-400 mx-auto" />
                    ) : index === 2 ? (
                      <Medal className="w-6 h-6 text-orange-700 mx-auto" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">
                        {index + 1}
                      </span>
                    )}

                  </div>

                  {/* Аватар */}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    {profile.avatar_emoji}
                  </div>

                  {/* Имя + престиж + спины */}
                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {profile.display_name}

                      {isMe && (
                        <span className="text-teal-600 text-xs ml-1">
                          (ты)
                        </span>
                      )}
                    </p>

                    {/* Престиж */}
                    <div className="flex items-center gap-1.5 mt-0.5">

                      <span className="text-sm">
                        {prestigeMedal}
                      </span>

                      <span className="text-xs font-semibold text-gray-500">
                        Престиж ×
                        {profile.prestige.toLocaleString(
                          "ru-RU"
                        )}
                      </span>

                    </div>

                    {/* Спины */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {profile.spins.toLocaleString(
                        "ru-RU"
                      )}{" "}
                      спинов
                    </p>

                  </div>

                  {/* Текущий баланс */}
                  <div className="text-right flex-shrink-0">

                    <p className="text-lg font-bold text-teal-600">
                      {formatMoney(
                        profile.balance
                      )}
                    </p>

                    <p className="text-xs text-gray-400">
                      ₽
                    </p>

                  </div>

                </div>

                {/* Реакции */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-50">

                  {REACTION_EMOJIS.map(
                    (emoji) => {

                      const count =
                        getReactionCount(
                          profile.user_id,
                          emoji
                        );

                      const reacted =
                        hasReacted(
                          profile.user_id,
                          emoji
                        );

                      const disabled =
                        isMe;

                      return (
                        <button
                          key={emoji}
                          onClick={() =>
                            handleReact(
                              profile.user_id,
                              emoji
                            )
                          }
                          disabled={disabled}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                            reacted
                              ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          } ${
                            disabled
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                        >

                          <span className="text-sm">
                            {emoji}
                          </span>

                          {count > 0 && (
                            <span>
                              {count}
                            </span>
                          )}

                        </button>
                      );
                    }
                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* Подсказка */}
      <p className="text-xs text-gray-400 text-center px-4">
        Рейтинг сортируется по престижу,
        затем по текущему балансу и спинам.
      </p>

    </div>
  );
}
