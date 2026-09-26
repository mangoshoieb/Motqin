"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { CheckCircle2, ExternalLink, GripVertical, Pause, Timer, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { RING_SECONDS } from "@/app/lib/session-alerts";

const formatClock = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Where the box was dragged to, as an offset from its resting corner. Kept
// in localStorage so it stays put across pages and reloads.
const POSITION_KEY = "motqin:session-timer-position";
// The gap it keeps from the edges of the screen, matching its resting inset.
const MARGIN = 24;
const EDGE = 8;

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
 * pulses with the chime, and stays until dismissed. It can be dragged
 * anywhere on the screen and remembers where it was left.
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

  const radius = 33;
  const circumference = 2 * Math.PI * radius;

  // Dragging. The offset lives in motion values so it survives the
  // running → finished swap below (which replaces the element).
  const boxRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // A drag must not fire the pause button underneath the pointer.
  const draggedRef = useRef(false);

  // How far the offset may go before the box leaves the screen. Measured,
  // so it is recomputed whenever the box changes size or the window does.
  const [limits, setLimits] = useState<{
    left: number;
    right: number;
    top: number;
    bottom: number;
  }>();

  // Where the user actually wants it. What's applied is this clamped to the
  // screen — kept apart so a transient measurement (a pane still laying out,
  // a narrow phone) can't overwrite the choice: widen the window and the box
  // goes back where it was put.
  const desired = useRef({ x: 0, y: 0 });

  const measureAndClamp = useCallback(() => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;

    const next = {
      left: EDGE - MARGIN,
      right: Math.max(EDGE - MARGIN, window.innerWidth - box.width - MARGIN - EDGE),
      top: -Math.max(0, window.innerHeight - box.height - MARGIN - EDGE),
      bottom: MARGIN - EDGE,
    };
    setLimits(next);
    x.set(Math.min(next.right, Math.max(next.left, desired.current.x)));
    y.set(Math.min(next.bottom, Math.max(next.top, desired.current.y)));
  }, [x, y]);

  // Restore where it was left. Mount only — after that the offset is the
  // drag's business.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(POSITION_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { x?: number; y?: number };
        desired.current = {
          x: typeof saved.x === "number" ? saved.x : 0,
          y: typeof saved.y === "number" ? saved.y : 0,
        };
      }
    } catch {
      // Storage disabled or corrupt — it just starts in its corner.
    }
    measureAndClamp();
  }, [measureAndClamp]);

  // Keep it on screen as the window resizes and as the box itself changes
  // size (it grows when the session finishes, and titles differ in length).
  useEffect(() => {
    window.addEventListener("resize", measureAndClamp);
    const observer = new ResizeObserver(measureAndClamp);
    if (boxRef.current) observer.observe(boxRef.current);
    return () => {
      window.removeEventListener("resize", measureAndClamp);
      observer.disconnect();
    };
  }, [measureAndClamp, finished]);

  const savePosition = () => {
    desired.current = { x: x.get(), y: y.get() };
    measureAndClamp();
    try {
      window.localStorage.setItem(POSITION_KEY, JSON.stringify(desired.current));
    } catch {
      // Not worth surfacing — the box simply forgets where it was.
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={finished ? "finished" : "running"}
        ref={boxRef}
        dir="rtl"
        role="status"
        aria-live="polite"
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={limits}
        style={{ x, y }}
        onPointerDown={() => {
          draggedRef.current = false;
        }}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={savePosition}
        // Only opacity and scale animate: x/y belong to the drag.
        initial={{ opacity: 0, scale: 0.95 }}
        animate={ringing ? { opacity: 1, scale: [1, 1.05, 1] } : { opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={
          ringing
            ? { scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }
            : { type: "spring", stiffness: 380, damping: 32 }
        }
        className={cn(
          "fixed bottom-6 left-6 z-[60] flex touch-none cursor-grab items-center gap-4 rounded-3xl border p-4 shadow-xl backdrop-blur transition-colors duration-500 active:cursor-grabbing",
          finished
            ? "border-emerald-300 bg-emerald-50/95 shadow-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/90"
            : "border-blue-200 bg-white/95 shadow-blue-500/15 dark:border-blue-900 dark:bg-zinc-900/95",
        )}
      >
        {finished ? (
          <span className="flex size-[84px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
            <CheckCircle2 size={42} />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Swallow the click that ends a drag.
              if (draggedRef.current) return;
              onPause();
            }}
            title="إيقاف مؤقت"
            aria-label="إيقاف الجلسة مؤقتًا"
            className="relative flex size-[84px] shrink-0 items-center justify-center"
          >
            <svg viewBox="0 0 84 84" className="absolute inset-0 -rotate-90">
              <circle cx="42" cy="42" r={radius} fill="none" strokeWidth="6" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <circle
                cx="42"
                cy="42"
                r={radius}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="stroke-blue-600 transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <span className="flex size-14 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700">
              <Pause size={24} />
            </span>
          </button>
        )}

        <div className="min-w-0">
          <div
            className={cn(
              "flex items-center gap-2 text-base font-semibold",
              finished ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            <Timer size={18} className={finished ? "text-emerald-600" : "text-blue-600"} />
            {finished ? "انتهت الجلسة — حان وقت الاستراحة" : "جلسة جارية"}
          </div>
          <div
            className={cn(
              "text-4xl font-bold tabular-nums leading-tight",
              finished ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100",
            )}
          >
            {finished ? formatClock(durationSeconds) : formatClock(remaining)}
          </div>
          <p className="max-w-64 truncate text-[18px] text-zinc-600 dark:text-zinc-300" title={title}>
            {title}
            {taskTitle && taskTitle !== title ? ` · ${taskTitle}` : ""}
          </p>
          {!onBoard && (
            <Link
              href={boardHref}
              // A drag that ends on the link must not navigate.
              onClick={(event) => {
                if (draggedRef.current) event.preventDefault();
              }}
              className="mt-1.5 inline-flex items-center gap-1.5 text-base font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              <ExternalLink size={16} />
              الذهاب إلى لوحة اليوم
            </Link>
          )}
        </div>

        {finished && (
          <button
            type="button"
            onClick={() => {
              if (draggedRef.current) return;
              onDismiss();
            }}
            title="إغلاق"
            aria-label="إغلاق"
            className="-me-1 self-start rounded-full p-1.5 text-emerald-700/70 transition hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300/70 dark:hover:bg-emerald-900/50"
          >
            <X size={22} />
          </button>
        )}

        {/* Drag affordance — the whole box drags, this just says so. */}
        <GripVertical
          aria-hidden
          size={20}
          className="shrink-0 self-center text-zinc-300 dark:text-zinc-600"
        />
      </motion.div>
    </AnimatePresence>
  );
};
