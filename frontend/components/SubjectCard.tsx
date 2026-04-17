import Link from "next/link";
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
}

export const SubjectCard = ({
  title,
  // description,
  // lessons,
  // hours,
  href,
  key,
  className,
  arrowPlay
}: SubjectCardProps) => {
  return (
    <Link
      key={key}
      href={href}
      className={cn(
        "group relative flex rounded-2xl my-4 overflow-hidden",
        "bg-white border border-zinc-200",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      {/* Main content */}
      <div className="flex-1 p-10">
        <h2 className="text-xl font-bold text-zinc-900">{title}</h2>

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
            "origin-left scale-x-0",
            "transition-transform duration-700 ease-out",
            "group-hover:scale-x-100"
          )}
        />

        {/* Arrow */}
        <div
          className={cn(
            "relative z-10",
            "transition-transform duration-300",
            "group-hover:translate-x-1"
          )}
        >
          <AnimatedArrow size={50} play={arrowPlay} />
        </div>
      </div>
    </Link>
  );
};
