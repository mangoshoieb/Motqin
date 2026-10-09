"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { AnimatedArrow } from "./AnimatedArrow";
import { CircleChevronRight, ChevronDown } from "lucide-react";

type LessonState = "start" | "continue" | "review";

interface LessonCardProps {
  name: string;
  outlines: string[];
  state: LessonState;
  href: string;
  className?: string;
  arrowPlay?: boolean;
  // Small label next to the title (e.g. "My lesson").
  badge?: ReactNode;
  // Buttons laid over the card. Kept outside the <Link> so a click on them
  // doesn't navigate (and so we don't nest buttons inside an <a>).
  actions?: ReactNode;
}

const stateStyles: Record<LessonState, string> = {
  start: "bg-emerald-100 text-emerald-700",
  continue: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
};

export const LessonCard = ({
  name,
  // outlines,
  // state,
  href,
  className,
  arrowPlay,
  badge,
  actions,
}: LessonCardProps) => {
  // const [expanded, setExpanded] = useState(false);

  // const hasMore = outlines.length > 2;
  // const visibleOutlines = expanded ? outlines : outlines.slice(0, 2);

  // const handleToggle = (e: React.MouseEvent) => {
  //   e.preventDefault(); // 🚫 prevent navigation
  //   e.stopPropagation(); // 🚫 stop bubbling to Link
  //   setExpanded((prev) => !prev);
  // };
console.log(name)
  return (
    <div
      className={cn(
        "group relative rounded-2xl",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1"
      )}
    >
    <Link
      href={href}
      className={cn(
        "relative block rounded-2xl p-6 pb-15",
        "bg-white border border-zinc-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-zinc-900">{name}</h2>
          {badge}
        </div>

        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold capitalize bg-emerald-100 text-emerald-700",
            // stateStyles[state]
          )}
        >
          أبدأ
        </span>
      </div>

      {/* Outlines */}
      {/* <div className="mt-4 relative">
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-300",
            !expanded && hasMore && "max-h-[80px] overflow-hidden"
          )}
        > */}
          {/* {visibleOutlines.map((outline, index) => (
            <div key={index} className="flex gap-3 items-start">
              <CircleChevronRight className="size-4 mt-1 shrink-0" />
              <span>{outline}</span>
            </div>
          ))} */}
        {/* </div> */}

        {/* Blur Fade */}
        {/* {!expanded && hasMore && (
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white to-transparent" />
        )} */}
      {/* </div> */}

      {/* Expand Arrow (ONLY controls expand) */}
      {/* {hasMore && (
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
      )} */}

      {/* Navigation Button */}
      <div className="absolute bottom-1 end-6">
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
          {/* The animation points right; mirror it on RTL pages. */}
          <div className="rtl:-scale-x-100">
            <AnimatedArrow size={30} play={arrowPlay} />
          </div>
        </div>
      </div>
    </Link>

      {actions && (
        <div className="absolute bottom-2 start-6 z-20 flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
};
