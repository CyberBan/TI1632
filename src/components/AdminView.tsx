import { useState, useEffect } from "react";
import { Shield, Users, BookOpen, Flame, Ban, CheckCircle2, Trash2, Loader2, ChevronRight } from "lucide-react";
import {
  fetchAllProfiles,
  setUserBanned,
  deleteUserAdmin,
  fetchAllHomework,
  fetchAllCandlePrayers,
  deleteHomeworkAdmin,
  deleteCandlePrayerAdmin,
} from "@/lib/api";
import type { Profile, Homework, CandlePrayer } from "@/lib/types";

type Section = "users" | "homework" | "prayers";

interface HomeworkWithAuthor extends Homework {
  profiles: { display_name: string } | null;
}
interface PrayerWithAuthor extends CandlePrayer {
  profiles: { display_name: string } | null;
}

export default function AdminView() {
  const [section, setSection] = useState<Section>("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [homework, setHomework] = useState<HomeworkWithAuthor[]>([]);
  const [prayers, setPrayers] = useState<PrayerWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSection("users");
  }, []);

  async function loadSection(s: Section) {
    setSection(s);
    setLoading(true);
    setError(null);
    try {
      if (s === "users") setProfiles(await fetchAllProfiles());
      else if (s === "homework") setHomework((await fetchAllHomework()) as HomeworkWithAuthor[]);
      else setPrayers((await fetchAllCandlePrayers()) as PrayerWithAuthor[]);
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  async function handleBan(userId: string, banned: boolean) {
    try {
      await setUserBanned(userId, !banned);
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, banned: !banned } : p)));
    } catch {
      setError("Не удалось изменить статус");
    }
  }

  async function handleDeleteUser(userId: string, displayName: string) {
    const confirmed = window.confirm(
      `Удалить пользователя «${displayName}»?\\n\\nБудут удалены его аккаунт и связанные данные. Отменить это действие нельзя.`
    );
    if (!confirmed) return;

    try {
      await deleteUserAdmin(userId);
      setProfiles((prev) => prev.filter((p) => p.id !== userId));
    } catch {
      setError("Не удалось удалить пользователя");
    }
  }

  async function handleDeleteHomework(id: string) {
    try {
      await deleteHomeworkAdmin(id);
      setHomework((prev) => prev.filter((h) => h.id !== id));
    } catch {
      setError("Не удалось удалить");
    }
  }

  async function handleDeletePrayer(id: string) {
    try {
      await deleteCandlePrayerAdmin(id);
      setPrayers((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Не удалось удалить");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-teal-600" />
        <h3 className="text-sm font-bold text-gray-800">Админ-панель</h3>
      </div>

      {/* Section switcher */}
      <div className="flex gap-2">
        <SectionButton active={section === "users"} onClick={() => loadSection("users")} icon={<Users className="w-4 h-4" />} label="Пользователи" />
        <SectionButton active={section === "homework"} onClick={() => loadSection("homework")} icon={<BookOpen className="w-4 h-4" />} label="Домашка" />
        <SectionButton active={section === "prayers"} onClick={() => loadSection("prayers")} icon={<Flame className="w-4 h-4" />} label="Свечки" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : section === "users" ? (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                {p.avatar_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.display_name}</p>
                  {p.role === "admin" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 uppercase">админ</span>
                  )}
                  {p.banned && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">бан</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Рекорд: {p.max_balance.toLocaleString("ru-RU")} ₽ · {p.spins} спинов
                </p>
              </div>
              {p.role !== "admin" && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleBan(p.id, p.banned)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      p.banned
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {p.banned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {p.banned ? "Разбан" : "Бан"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(p.id, p.display_name)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Удалить пользователя"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Нет пользователей</p>
          )}
        </div>
      ) : section === "homework" ? (
        <div className="space-y-2">
          {homework.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{h.subject}</span>
                    {h.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{h.text}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {h.profiles?.display_name ? `${h.profiles.display_name} · ` : ""}
                    {new Date(h.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteHomework(h.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {homework.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Нет домашки</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {prayers.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{p.subject}</span>
                  </div>
                  <p className="text-xs text-gray-500">{p.wish}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {p.profiles?.display_name ? `${p.profiles.display_name} · ` : ""}
                    {new Date(p.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePrayer(p.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {prayers.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Нет свечек</p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-medium text-xs transition-all ${
        active
          ? "bg-teal-600 text-white shadow-md shadow-teal-200"
          : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
