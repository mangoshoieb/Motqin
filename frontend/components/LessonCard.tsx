"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/app/lib/utils";
import { AnimatedArrow } from "./AnimatedArrow";
import { CircleChevronRight, ChevronDown } from "lucide-react";

type LessonState = "start" | "continue" | "review";

interface LessonCardProps {
  title: string;
  outlines: string[];
  state: LessonState;
  href: string;
  className?: string;
  arrowPlay?: boolean;
}

const stateStyles: Record<LessonState, string> = {
  start: "bg-emerald-100 text-emerald-700",
  continue: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
};

export const LessonCard = ({
  title,
  outlines,
  state,
  href,
  className,
  arrowPlay,
}: LessonCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const hasMore = outlines.length > 2;
  const visibleOutlines = expanded ? outlines : outlines.slice(0, 2);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // 🚫 prevent navigation
    e.stopPropagation(); // 🚫 stop bubbling to Link
    setExpanded((prev) => !prev);
  };

  return (
    <Link
      href={href}
      className={cn(
        "group relative block rounded-2xl p-6",
        "bg-white border border-zinc-200",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-zinc-900">{title}</h2>

        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold capitalize",
            stateStyles[state]
          )}
        >
          {state}
        </span>
      </div>

      {/* Outlines */}
      <div className="mt-4 relative">
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-300",
            !expanded && hasMore && "max-h-[80px] overflow-hidden"
          )}
        >
          {visibleOutlines.map((outline, index) => (
            <div key={index} className="flex gap-3 items-start">
              <CircleChevronRight className="size-4 mt-1 shrink-0" />
              <span>{outline}</span>
            </div>
          ))}
        </div>

        {/* Blur Fade */}
        {!expanded && hasMore && (
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Expand Arrow (ONLY controls expand) */}
      {hasMore && (
        <div className="flex justify-center mt-3">
          <button
            onClick={handleToggle}
            className="relative px-8 py-4 -m-5 rounded-full cursor-pointer hover:bg-zinc-200 transition"
          >
            <ChevronDown
              className={cn(
                "transition-transform duration-300",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      )}

      {/* Navigation Button */}
      <div className="absolute bottom-6 right-6">
        <div
          className={cn(
            "flex items-center justify-center",
            "h-10 w-10 rounded-full",
            "bg-blue-100 text-blue-700",
            "transition-all duration-300",
            "group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700",
            "group-hover:text-white"
          )}
        >
          <AnimatedArrow size={30} play={arrowPlay} />
        </div>
      </div>
    </Link>
  );
};
