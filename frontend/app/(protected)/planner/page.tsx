"use client";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { useState } from "react";
import ExpandedDayCard from "@/components/ExpandedDayCard";
import { cn } from "@/app/lib/utils";
interface DayProps {
  dayName: string;
  date: string;

  completedTasks: number;

  workingHours: number;
  focusSessions: number;

  mood: "مذهل" | "ممتاز" | "جيد" | "متوسط";
  showBorder?: boolean;

  onClick?: () => void;
}

const Planner = () => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const visibleDays =
    expandedDay === null
      ? weekData
      : weekData.filter((_, index) => {
          const { start, end } = getVisibleRange(expandedDay);
          // 0 1 2 3 4 5 6
          return index >= start && index <= end;
        });

  function getVisibleRange(selectedIndex: number) {
    if (selectedIndex <= 3) {
      return { start: 0, end: 4 };
    }

    if (selectedIndex <= 3) {
      return { start: 1, end: 5 };
    }

    return { start: 2, end: 6 };
  }

  function hideBorder(selectedIndex: number) {
    if (selectedIndex <= 3) {
      return true;
    } else {
      return false;
    }
  }

  return (
    <main className="h-full w-full bg-[var(--surface)]" dir="rtl">
      <div className="p-2 ">
        <div className="flex gap-40">
          <h1 className="text-3xl font-bold py-4">الأسبوع الأول</h1>
          <div className="mt-5 text-lg font-semibold">18 يونيو - 24 يونيو</div>
        </div>
        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw]">
          {weekData.map((day, index) => {
            const isVisible =
              expandedDay === null
                ? true
                : visibleDays.some((d) => d.index === day.index);

            return (
              <div
                key={day.index}
                className={cn(
                  "overflow-hidden transition-all duration-700",

                  expandedDay === day.index
                    ? "flex-[3]"
                    : isVisible
                    ? "flex-1"
                    : "flex-0 opacity-0"
                )}
              >
                {expandedDay === day.index ? (
                  <ExpandedDayCard
                    {...day}
                    showBorder={hideBorder(day.index)}
                    onCollapse={() => setExpandedDay(null)}
                  />
                ) : (
                  <DayCard
                    key={day.dayName}
                    {...day}
                    showBorder={hideBorder(expandedDay || 9)}
                    onClick={() => {
                      if (expandedDay === day.index) {
                        setExpandedDay(null);
                      } else {
                        setExpandedDay(day.index);
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div>Goals</div>
      </div>
    </main>
  );
};

export default Planner;
