"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Undo2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatDayLong, formatDayShort, relativeDayLabel } from "@/app/lib/review-format";
import type { ReviewTimelineState } from "@/app/hooks/useReviewTimeline";

// A day the scrubber can stop on: only days that have reviews.
export interface TimelineStop {
  day: string;
  daysFromToday: number;
  state: ReviewTimelineState;
}

export const STOP_COLOR: Record<ReviewTimelineState, string> = {
  upcoming: "bg-sky-500",
  today: "bg-emerald-500",
  completed: "bg-orange-500",
  missed: "bg-red-500",
};

// How close (px) the "back to today" chip may come to the position label
// before it steps out of the way.
const CHIP_CLEARANCE = 38;

// The full review table's date scrubber: a thin vertical track from the
// newest day (top) to the oldest (bottom), one evenly spaced stop per day
// with reviews. Dragging, clicking or the arrow keys jump between those
// stops only; empty days have none.
export function ReviewTimelineScrubber({
  stops,
  current,
  today,
  todayPosition,
  atToday,
  onJump,
  onBackToToday,
}: {
  stops: TimelineStop[];
  // Index of the stop at the top of the list, or null while today's own
  // (empty) section is.
  current: number | null;
  today: string;
  // Where today falls between the stops, as a fractional index.
  todayPosition: number;
  atToday: boolean;
  onJump: (index: number) => void;
  onBackToToday: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(0);
  // While dragging, the stop under the pointer — the list may lag a frame.
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const count = stops.length;
  const hasStops = count > 0;

  // The track only renders once there are stops.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => setTrackHeight(entry.contentRect.height));
    observer.observe(track);
    return () => observer.disconnect();
  }, [hasStops]);

  if (count === 0) return null;

  const fractionOf = (position: number) =>
    count === 1 ? 0.5 : Math.min(Math.max(position, 0), count - 1) / (count - 1);

  const shown = dragIndex ?? current;
  const markerFraction = fractionOf(shown ?? todayPosition);
  const todayFraction = fractionOf(todayPosition);
  const shownStop = shown === null ? null : stops[shown];

  // The chip sits at today's spot on the track, unless that's right where
  // the position label is.
  const markerY = markerFraction * trackHeight;
  let chipY = todayFraction * trackHeight;
  if (Math.abs(chipY - markerY) < CHIP_CLEARANCE) {
    chipY = chipY >= markerY ? markerY + CHIP_CLEARANCE : markerY - CHIP_CLEARANCE;
    if (chipY > trackHeight) chipY = markerY - CHIP_CLEARANCE;
    if (chipY < 0) chipY = markerY + CHIP_CLEARANCE;
  }

  const indexAt = (clientY: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const fraction = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return Math.round(fraction * (count - 1));
  };

  const jump = (index: number) => onJump(Math.min(Math.max(index, 0), count - 1));

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const index = indexAt(event.clientY);
    setDragIndex(index);
    jump(index);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragIndex === null) return;
    const index = indexAt(event.clientY);
    if (index === dragIndex) return;
    setDragIndex(index);
    jump(index);
  };

  const endDrag = () => setDragIndex(null);

  // Up is newer, down is older — the same way the list runs.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = current ?? Math.round(todayPosition);
    const target = {
      ArrowUp: from - 1,
      ArrowDown: from + 1,
      PageUp: from - 5,
      PageDown: from + 5,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    jump(target);
  };

  const first = stops[0];
  const last = stops[count - 1];

  return (
    <aside
      aria-label="الخط الزمني للمراجعات"
      className="flex w-24 shrink-0 select-none flex-col py-1 sm:w-32"
    >
      <EdgeLabel stop={first} />

      <div className="relative my-3 min-h-0 flex-1">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="انتقل إلى يوم"
          aria-valuemin={1}
          aria-valuemax={count}
          aria-valuenow={(shown ?? Math.round(todayPosition)) + 1}
          aria-valuetext={formatDayLong(shownStop?.day ?? today)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute inset-0 touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
            dragIndex === null ? "cursor-pointer" : "cursor-grabbing"
          )}
        >
          {/* Track */}
          <span className="pointer-events-none absolute inset-y-0 start-3 w-px bg-zinc-300 dark:bg-zinc-700" />

          {/* One tick per day with reviews, in that day's colour */}
          {stops.map((stop, index) => (
            <span
              key={stop.day}
              className={cn(
                "pointer-events-none absolute start-2 h-0.5 w-[9px] -translate-y-1/2 rounded-full opacity-70",
                STOP_COLOR[stop.state]
              )}
              style={{ top: `${fractionOf(index) * 100}%` }}
            />
          ))}

          {/* Today */}
          <span
            className="pointer-events-none absolute start-0.5 h-0.5 w-[21px] -translate-y-1/2 rounded-full bg-emerald-600 dark:bg-emerald-400"
            style={{ top: `${todayFraction * 100}%` }}
          />

          {/* Where the list is */}
          <div
            className={cn(
              "pointer-events-none absolute start-[9px] flex -translate-y-1/2 items-center gap-2",
              dragIndex === null && "transition-[top] duration-150 ease-out"
            )}
            style={{ top: `${markerFraction * 100}%` }}
          >
            <span
              className={cn(
                "h-8 w-[7px] rounded-full shadow-sm ring-2 ring-zinc-100 dark:ring-zinc-950",
                STOP_COLOR[shownStop?.state ?? "today"]
              )}
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100" dir="ltr">
                {shown === null ? "اليوم" : `${shown + 1}/${count}`}
              </span>
              <span className="whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatDayShort(shownStop?.day ?? today)}
              </span>
            </span>
          </div>
        </div>

        {!atToday && (
          <button
            type="button"
            onClick={onBackToToday}
            className="absolute start-7 z-10 inline-flex -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            style={{ top: chipY }}
          >
            <Undo2 className="size-3" />
            اليوم
          </button>
        )}
      </div>

      <EdgeLabel stop={last} />
    </aside>
  );
}

// The newest / oldest day at either end of the track.
function EdgeLabel({ stop }: { stop: TimelineStop }) {
  return (
    <div className="flex flex-col ps-0.5 leading-tight">
      <span className="whitespace-nowrap text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {formatDayShort(stop.day)}
      </span>
      <span className="whitespace-nowrap text-[11px] text-zinc-400 dark:text-zinc-500">
        {relativeDayLabel(stop.daysFromToday)}
      </span>
    </div>
  );
}
