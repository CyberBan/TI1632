import { useState, useEffect } from "react";
import {
  CalendarDays,
  BookOpen,
  GraduationCap,
  Sparkles,
  Flame,
  Dices,
  Trophy,
  LogOut,
  Timer,
  Shield,
  Ban,
  PawPrint,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/lib/api";
import type { Profile } from "@/lib/types";
import ScheduleView from "@/components/ScheduleView";
import HomeworkView from "@/components/HomeworkView";
import SlotsView from "@/components/SlotsView";
import CandleView from "@/components/CandleView";
import RatingView from "@/components/RatingView";
import TimerView from "@/components/TimerView";
import AdminView from "@/components/AdminView";
import AuthView from "@/components/AuthView";

type Tab = "schedule" | "homework" | "timer" | "activity" | "admin";
type ActivityMode = "candle" | "slots" | "rating" | "pets";

export default function App() {
  const [session, setSession] = useState<null | {
    user: { id: string; email: string };
  }>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [activityMode, setActivityMode] =
    useState<ActivityMode>("candle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as any);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        (async () => {
          setSession(sess as any);

          if (!sess) {
            setProfile(null);
          }
        })();
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id)
        .then(setProfile)
        .catch(() => setProfile(null));
    } else {
      setProfile(null);
    }
  }, [session?.user?.id]);

  if (authLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <GraduationCap className="w-8 h-8 text-teal-600 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  if (profile?.banned) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <Ban className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Аккаунт заблокирован
        </h1>

        <p className="text-sm text-gray-400 text-center mb-6">
          Обратитесь к администратору, если считаете, что это ошибка.
        </p>

        <button
          onClick={async () => await supabase.auth.signOut()}
          className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          Выйти
        </button>
      </div>
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="bg-white border-b border-gray-100 sticky top-0 z-10"
        style={{
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="max-w-md mx-auto px-4 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-base leading-tight">
              Группа 163
            </h1>

            <p className="text-xs text-gray-400 leading-tight truncate">
              {profile
                ? `${profile.avatar_emoji} ${profile.display_name}`
                : session.user.email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 pb-24">
        {activeTab === "schedule" ? (
          <ScheduleView />
        ) : activeTab === "homework" ? (
          <HomeworkView />
        ) : activeTab === "timer" ? (
          <TimerView />
        ) : activeTab === "admin" ? (
          <AdminView />
        ) : (
          <>
            {/* Activity tabs */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {/* Свечка */}
              <button
                onClick={() => setActivityMode("candle")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl font-medium text-xs transition-all ${
                  activityMode === "candle"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <Flame className="w-4 h-4" />
                Свечка
              </button>

              {/* Слоты */}
              <button
                onClick={() => setActivityMode("slots")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl font-medium text-xs transition-all ${
                  activityMode === "slots"
                    ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <Dices className="w-4 h-4" />
                Слоты
              </button>

              {/* Рейтинг */}
              <button
                onClick={() => setActivityMode("rating")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl font-medium text-xs transition-all ${
                  activityMode === "rating"
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Рейтинг
              </button>

              {/* Питомцы */}
              <button
                onClick={() => setActivityMode("pets")}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl font-medium text-xs transition-all ${
                  activityMode === "pets"
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                }`}
              >
                <PawPrint className="w-4 h-4" />
                Питомцы
              </button>
            </div>

            {/* Activity content */}
            {activityMode === "candle" ? (
              <CandleView />
            ) : activityMode === "slots" ? (
              <SlotsView />
            ) : activityMode === "rating" ? (
              <RatingView />
            ) : (
              /* Pets — coming soon */
              <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
                {/* Декоративные лапки */}
                <div className="absolute top-5 left-6 text-2xl opacity-20 rotate-[-20deg]">
                  🐾
                </div>

                <div className="absolute top-12 right-7 text-xl opacity-20 rotate-12">
                  🐾
                </div>

                <div className="absolute bottom-10 left-10 text-xl opacity-15 rotate-12">
                  ✨
                </div>

                <div className="absolute bottom-7 right-10 text-2xl opacity-20 rotate-[-15deg]">
                  🐾
                </div>

                <div className="px-6 py-12 text-center">
                  {/* Иконка */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-100 to-purple-100 animate-pulse" />

                    <div className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <PawPrint className="w-11 h-11 text-violet-500" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Питомцы
                  </h2>

                  {/* Статус */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold mb-5">
                    <Sparkles className="w-3.5 h-3.5" />
                    В разработке
                  </div>

                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    Мы готовим кое-что милое.
                    <br />
                    Скоро здесь появятся ваши питомцы.
                  </p>

                  {/* Дата */}
                  <div className="mt-7 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">
                      Первый релиз
                    </p>

                    <p className="text-lg font-bold text-gray-800">
                      2 октября
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Увидимся совсем скоро 🐾
                    </p>
                  </div>

                  {/* Питомцы */}
                  <div className="mt-7 flex justify-center items-end gap-4">
                    <div className="text-4xl animate-bounce [animation-delay:0ms]">
                      🐱
                    </div>

                    <div className="text-5xl animate-bounce [animation-delay:150ms]">
                      🐶
                    </div>

                    <div className="text-4xl animate-bounce [animation-delay:300ms]">
                      🐰
                    </div>
                  </div>

                  <p className="mt-5 text-xs text-gray-300">
                    Следите за обновлениями
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-md mx-auto flex">
          {/* Расписание */}
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "schedule"
                ? "text-teal-600"
                : "text-gray-400"
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-xs font-medium">
              Расписание
            </span>
          </button>

          {/* Домашка */}
          <button
            onClick={() => setActiveTab("homework")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "homework"
                ? "text-teal-600"
                : "text-gray-400"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-medium">
              Домашка
            </span>
          </button>

          {/* Таймер */}
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "timer"
                ? "text-teal-600"
                : "text-gray-400"
            }`}
          >
            <Timer className="w-5 h-5" />
            <span className="text-xs font-medium">
              Таймер
            </span>
          </button>

          {/* Активность */}
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "activity"
                ? "text-teal-600"
                : "text-gray-400"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-medium">
              Активность
            </span>
          </button>

          {/* Админ */}
          {profile?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                activeTab === "admin"
                  ? "text-teal-600"
                  : "text-gray-400"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs font-medium">
                Админ
              </span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
