"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Pause, Timer, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { RING_SECONDS } from "@/app/lib/session-alerts";

const formatClock = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

interface FloatingSessionTimerProps {
  title: string;
  taskTitle?: string;
  durationSeconds: number;
  elapsedSeconds: number;
  finished: boolean;
  // Seconds since the clock ran out — while under RING_SECONDS the box
  // keeps pulsing along with the chime.
  finishedForSeconds: number;
  // Where the session's board is, for the link shown on other pages.
  boardHref: string;
  onPause: () => void;
  onDismiss: () => void;
}

/**
 * The countdown pinned to the corner of every page while a session is on
 * the clock. Blue and ticking while it runs; when time is up it turns green,
 * pulses with the chime, and stays until dismissed.
 */
export const FloatingSessionTimer = ({
  title,
  taskTitle,
  durationSeconds,
  elapsedSeconds,
  finished,
  finishedForSeconds,
  boardHref,
  onPause,
  onDismiss,
}: FloatingSessionTimerProps) => {
  const pathname = usePathname();
  const onBoard = pathname === boardHref.split("?")[0];
  const remaining = Math.max(0, durationSeconds - elapsedSeconds);
  const progress = durationSeconds > 0 ? Math.min(1, elapsedSeconds / durationSeconds) : 0;
  const ringing = finished && finishedForSeconds < RING_SECONDS;

  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <AnimatePresence>
      <motion.div
        key={finished ? "finished" : "running"}
        dir="rtl"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={
          ringing
            ? { opacity: 1, y: 0, scale: [1, 1.05, 1] }
            : { opacity: 1, y: 0, scale: 1 }
        }
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={
          ringing
            ? { scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }
            : { type: "spring", stiffness: 380, damping: 32 }
        }
        className={cn(
          "fixed bottom-6 left-6 z-[60] flex items-center gap-3 rounded-2xl border py-3 pe-3 ps-3 shadow-xl backdrop-blur transition-colors duration-500",
          finished
            ? "border-emerald-300 bg-emerald-50/95 shadow-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/90"
            : "border-blue-200 bg-white/95 shadow-blue-500/15 dark:border-blue-900 dark:bg-zinc-900/95",
        )}
      >
        {finished ? (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
            <CheckCircle2 size={28} />
          </span>
        ) : (
          <button
            type="button"
            onClick={onPause}
            title="إيقاف مؤقت"
            aria-label="إيقاف الجلسة مؤقتًا"
            className="relative flex size-14 shrink-0 items-center justify-center"
          >
            <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
              <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="stroke-blue-600 transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700">
              <Pause size={16} />
            </span>
          </button>
        )}

        <div className="min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold",
              finished ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            <Timer size={12} className={finished ? "text-emerald-600" : "text-blue-600"} />
            {finished ? "انتهت الجلسة — حان وقت الاستراحة" : "جلسة جارية"}
          </div>
          <div
            className={cn(
              "text-2xl font-bold tabular-nums leading-tight",
              finished ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100",
            )}
          >
            {finished ? formatClock(durationSeconds) : formatClock(remaining)}
          </div>
          <p className="max-w-44 truncate text-xs text-zinc-600 dark:text-zinc-300" title={title}>
            {title}
            {taskTitle && taskTitle !== title ? ` · ${taskTitle}` : ""}
          </p>
          {!onBoard && (
            <Link
              href={boardHref}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              <ExternalLink size={11} />
              الذهاب إلى لوحة اليوم
            </Link>
          )}
        </div>

        {finished && (
          <button
            type="button"
            onClick={onDismiss}
            title="إغلاق"
            aria-label="إغلاق"
            className="-me-1 self-start rounded-full p-1 text-emerald-700/70 transition hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300/70 dark:hover:bg-emerald-900/50"
          >
            <X size={15} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
