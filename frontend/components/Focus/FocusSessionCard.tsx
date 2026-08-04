"use client";

import { Pause, Play, RotateCcw, Square, Timer } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  FOCUS_DURATIONS,
  formatCountdown,
  formatTimes,
  formatUsage,
} from "@/app/constants/focus.constants";
import { useFocusSession } from "@/app/hooks/useFocusSession";

const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// The only genuinely working part of this screen: a real countdown plus a real
// leave-count from the Page Visibility API. Everything else here describes a
// policy the browser cannot enforce; this one does what it says.
export const FocusSessionCard = () => {
  const session = useFocusSession(FOCUS_DURATIONS[0]);
  const { status, summary } = session;

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isActive = isRunning || isPaused;

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      dir="rtl"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <Timer className="text-blue-600 dark:text-blue-400" size={22} />
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">جلسة تركيز</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            تعمل داخل المتصفح الآن — لا تحتاج جهازًا مرتبطًا
          </p>
        </div>
      </div>

      {status === "completed" && summary ? (
        <SessionSummaryView
          focusedSeconds={summary.focusedSeconds}
          leaveCount={summary.leaveCount}
          onReset={session.reset}
        />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Countdown ring */}
          <div className="relative shrink-0">
            <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
              <circle
                cx="100"
                cy="100"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="10"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <circle
                cx="100"
                cy="100"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - session.progress)}
                className={cn(
                  "transition-[stroke-dashoffset] duration-1000 ease-linear",
                  isPaused ? "stroke-amber-500" : "stroke-blue-600 dark:stroke-blue-500"
                )}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCountdown(session.remainingSeconds)}
              </span>
              <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {isPaused ? "متوقفة مؤقتًا" : isRunning ? "جارية" : "جاهزة للبدء"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full sm:max-w-xs">
            <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              مدة الجلسة
            </p>

            <div className="flex gap-2">
              {FOCUS_DURATIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => session.changeDuration(minutes)}
                  disabled={isActive}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                    session.durationMinutes === minutes
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  {minutes} د
                </button>
              ))}
            </div>

            {/* Live leave counter — neutral wording on purpose: the tab being
                hidden is all the browser knows, not what the student did. */}
            {isActive && (
              <div className="mt-4 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  غادرت الصفحة أثناء الجلسة
                </p>
                <p
                  className={cn(
                    "mt-1 text-lg font-bold",
                    session.leaveCount === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {session.leaveCount === 0 ? "لم تغادر بعد" : formatTimes(session.leaveCount)}
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {status === "idle" && (
                <button
                  type="button"
                  onClick={session.start}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  <Play size={17} />
                  ابدأ الجلسة
                </button>
              )}

              {isRunning && (
                <button
                  type="button"
                  onClick={session.pause}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-3 font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Pause size={17} />
                  إيقاف مؤقت
                </button>
              )}

              {isPaused && (
                <button
                  type="button"
                  onClick={session.resume}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  <Play size={17} />
                  متابعة
                </button>
              )}

              {isActive && (
                <button
                  type="button"
                  onClick={session.stop}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-3 font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Square size={16} />
                  إنهاء
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const SessionSummaryView = ({
  focusedSeconds,
  leaveCount,
  onReset,
}: {
  focusedSeconds: number;
  leaveCount: number;
  onReset: () => void;
}) => {
  const minutes = Math.round(focusedSeconds / 60);

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="text-4xl" aria-hidden>
        {leaveCount === 0 ? "🎯" : "✅"}
      </span>

      <h3 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
        انتهت الجلسة
      </h3>

      <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatUsage(Math.max(1, minutes))}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">وقت التركيز</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p
            className={cn(
              "text-2xl font-bold",
              leaveCount === 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {leaveCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">مرات مغادرة الصفحة</p>
        </div>
      </div>

      <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {leaveCount === 0
          ? "جلسة كاملة دون مغادرة الصفحة — هذا هو الشكل الذي تبدو عليه الجلسة المركّزة."
          : "المتصفح يعرف فقط أنك غادرت الصفحة، لا إلى أين ذهبت. اعتبرها ملاحظة لا حكمًا."}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <RotateCcw size={15} />
        جلسة جديدة
      </button>
    </div>
  );
};
