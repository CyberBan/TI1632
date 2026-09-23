import { useState, useEffect, useMemo } from "react";
import { Timer, Clock, MapPin, User, Coffee, PartyPopper, Loader2 } from "lucide-react";
import { fetchScheduleEvents } from "@/lib/api";
import {
  type ScheduleEvent,
  DAY_NAMES,
  LESSON_TYPE_LABELS,
  LESSON_TYPE_COLORS,
  getSemesterStart,
  shouldShowEvent,
} from "@/lib/types";

function formatTime(time: string): string {
  if (time.includes(":")) return time;
  return `${time.substring(0, 2)}:${time.substring(2)}`;
}

function parseTimeToMinutes(time: string): number {
  const formatted = formatTime(time);
  const [h, m] = formatted.split(":").map(Number);
  return h * 60 + m;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

interface CurrentLesson {
  lesson: ScheduleEvent;
  remaining: number;
}

function findCurrentLesson(
  events: ScheduleEvent[],
  semesterStart: Date | null,
  now: Date
): CurrentLesson | null {
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const todayEvents = events
    .filter((e) => e.day_of_week === dayOfWeek)
    .filter((e) => semesterStart ? shouldShowEvent(e, "odd", semesterStart, now) : true)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  for (const evt of todayEvents) {
    const start = parseTimeToMinutes(evt.start_time);
    const end = parseTimeToMinutes(evt.end_time);
    if (currentMin >= start && currentMin < end) {
      return { lesson: evt, remaining: end - currentMin };
    }
  }
  return null;
}

function findNextLesson(
  events: ScheduleEvent[],
  semesterStart: Date | null,
  now: Date
): { lesson: ScheduleEvent; inMinutes: number } | null {
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const todayEvents = events
    .filter((e) => e.day_of_week === dayOfWeek)
    .filter((e) => semesterStart ? shouldShowEvent(e, "odd", semesterStart, now) : true)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  for (const evt of todayEvents) {
    const start = parseTimeToMinutes(evt.start_time);
    if (start > currentMin) {
      return { lesson: evt, inMinutes: start - currentMin };
    }
  }
  return null;
}

function formatRemaining(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function formatRemainingDetailed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const s = 60 - new Date().getSeconds();
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TimerView() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchScheduleEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const semesterStart = useMemo(() => getSemesterStart(events), [events]);
  const current = useMemo(() => findCurrentLesson(events, semesterStart, now), [events, semesterStart, now]);
  const next = useMemo(() => findNextLesson(events, semesterStart, now), [events, semesterStart, now]);
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current lesson countdown */}
      {current ? (
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-5 h-5 text-teal-200" />
            <p className="text-teal-100 text-xs font-medium">До конца пары осталось</p>
          </div>
          <p className="text-5xl font-bold tracking-tight mt-2 tabular-nums">
            {formatRemainingDetailed(current.remaining)}
          </p>
          <p className="text-teal-200 text-sm mt-1">{formatRemaining(current.remaining)}</p>

          <div className="mt-5 pt-5 border-t border-white/20">
            <p className="font-semibold text-base">{current.lesson.subject}</p>
            <div className="flex items-center gap-2 mt-2 text-teal-100 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatTime(current.lesson.start_time)} — {formatTime(current.lesson.end_time)}
              </span>
            </div>
            {current.lesson.location && (
              <div className="flex items-center gap-2 mt-1.5 text-teal-100 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>{current.lesson.location}</span>
              </div>
            )}
            {current.lesson.teacher && (
              <div className="flex items-center gap-2 mt-1.5 text-teal-100 text-xs">
                <User className="w-3.5 h-3.5" />
                <span>{current.lesson.teacher}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${Math.min(100, 100 - (current.remaining / (parseTimeToMinutes(current.lesson.end_time) - parseTimeToMinutes(current.lesson.start_time))) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : next ? (
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="w-5 h-5 text-amber-100" />
            <p className="text-amber-50 text-xs font-medium">Сейчас перемена. Следующая пара через</p>
          </div>
          <p className="text-4xl font-bold tracking-tight mt-2 tabular-nums">
            {formatRemaining(next.inMinutes)}
          </p>

          <div className="mt-5 pt-5 border-t border-white/20">
            <p className="font-semibold text-base">{next.lesson.subject}</p>
            <div className="flex items-center gap-2 mt-2 text-amber-50 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatTime(next.lesson.start_time)} — {formatTime(next.lesson.end_time)}
              </span>
            </div>
            {next.lesson.location && (
              <div className="flex items-center gap-2 mt-1.5 text-amber-50 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span>{next.lesson.location}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg text-center">
          <PartyPopper className="w-12 h-12 mx-auto mb-3" />
          <p className="text-xl font-bold">Пар больше нет!</p>
          <p className="text-emerald-100 text-sm mt-1">
            {DAY_NAMES[dayOfWeek - 1]} свободен. Можно отдыхать.
          </p>
        </div>
      )}

      {/* Today's schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {DAY_NAMES[dayOfWeek - 1]} — все пары
        </h3>
        <TodaySchedule events={events} semesterStart={semesterStart} now={now} current={current} next={next} />
      </div>
    </div>
  );
}

function TodaySchedule({
  events,
  semesterStart,
  now,
  current,
  next,
}: {
  events: ScheduleEvent[];
  semesterStart: Date | null;
  now: Date;
  current: CurrentLesson | null;
  next: { lesson: ScheduleEvent; inMinutes: number } | null;
}) {
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const todayEvents = events
    .filter((e) => e.day_of_week === dayOfWeek)
    .filter((e) => (semesterStart ? shouldShowEvent(e, "odd", semesterStart, now) : true))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (todayEvents.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">Сегодня пар нет</p>;
  }

  return (
    <div className="space-y-2">
      {todayEvents.map((evt) => {
        const start = parseTimeToMinutes(evt.start_time);
        const end = parseTimeToMinutes(evt.end_time);
        const isPast = currentMin >= end;
        const isNow = current?.lesson.uid === evt.uid;
        const isNext = next?.lesson.uid === evt.uid;
        const typeKey = evt.lesson_type || "";
        const typeLabel = LESSON_TYPE_LABELS[typeKey] || typeKey;
        const typeColor = LESSON_TYPE_COLORS[typeKey] || "bg-gray-100 text-gray-600 border-gray-200";

        return (
          <div
            key={evt.uid}
            className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
              isNow
                ? "bg-teal-50 ring-1 ring-teal-200"
                : isNext
                ? "bg-amber-50"
                : isPast
                ? "opacity-40"
                : "bg-gray-50"
            }`}
          >
            <div className="text-center flex-shrink-0 w-14">
              <p className="text-xs font-bold text-gray-700">{formatTime(evt.start_time)}</p>
              <p className="text-[10px] text-gray-400">{formatTime(evt.end_time)}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{evt.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {typeLabel && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeColor}`}>
                    {typeLabel}
                  </span>
                )}
                {isNow && (
                  <span className="text-[10px] font-bold text-teal-600 uppercase">сейчас</span>
                )}
                {isNext && !isNow && (
                  <span className="text-[10px] font-bold text-amber-600 uppercase">следующая</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
