import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { AnimatedArrow } from "./AnimatedArrow";

interface SubjectCardProps {
  title: string;
  // description?: string;
  // lessons: number;
  // hours: number;
  href: string;
  key: string;
  className?: string;
  arrowPlay?: boolean;
  // Small label next to the title (e.g. "My subject").
  badge?: ReactNode;
  // Buttons laid over the card's corner. Kept outside the <Link> so a click
  // on them doesn't navigate (and so we don't nest buttons inside an <a>).
  actions?: ReactNode;
}

export const SubjectCard = ({
  title,
  // description,
  // lessons,
  // hours,
  href,
  key,
  className,
  arrowPlay,
  badge,
  actions,
}: SubjectCardProps) => {
  return (
    <div
      key={key}
      className={cn(
        "group relative rounded-2xl my-4 overflow-hidden",
        "bg-white border border-zinc-200",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      <Link href={href} className="flex">
        {/* Main content */}
        <div className="flex-1 p-10">
          <div className={cn("flex flex-wrap items-center gap-3", actions && "pe-20")}>
            <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
            {badge}
          </div>

          {/* {description && (
            <p className="text-sm text-zinc-600 mt-1 max-w-md">{description}</p>
          )} */}

          {/* <div className="flex gap-6 mt-6 text-sm text-zinc-700">
            <div>
              <span className="font-semibold">{lessons}</span> lessons
            </div>
            <div>
              <span className="font-semibold">{hours}</span> hours
            </div>
          </div> */}
        </div>

        {/* Action column */}
        <div className="relative w-20 sm:w-28 flex items-center justify-center overflow-hidden">
          {/* Animated background fill */}
          <div
            className={cn(
              "absolute inset-0 bg-blue-600",
              "origin-left rtl:origin-right scale-x-0",
              "transition-transform duration-700 ease-out",
              "group-hover:scale-x-100"
            )}
          />

          {/* Arrow */}
          <div
            className={cn(
              "relative z-10",
              "transition-transform duration-300",
              "group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            )}
          >
            {/* The animation points right; mirror it on RTL pages. */}
            <div className="rtl:-scale-x-100">
              <AnimatedArrow size={50} play={arrowPlay} />
            </div>
          </div>
        </div>
      </Link>

      {actions && (
        <div className="absolute top-3 end-24 sm:end-32 z-20 flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
};
