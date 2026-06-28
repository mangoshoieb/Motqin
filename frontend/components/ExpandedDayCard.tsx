"use client";
import { cn } from "@/app/lib/utils";
import { useEffect, useState } from "react";
import { CheckSquare, Play, Plus, Square } from "lucide-react";
import { Session, Task } from "@/app/types/planner.types";
import { categoryStyles, moodOptions } from "@/app/constants/planner.constants";

interface ExpandedDayCardProps {
  index: number;
  dayName: string;
  date: string;
  tasks: Task[];
  mood: "مذهل" | "ممتاز" | "جيد" | "متوسط";
  workingHours: number;
  sessions?: Session[];
  selected?: boolean;
  istoday?: boolean;
  showBorder?: boolean;
  notes?: string[];
  learningOutput?: string[];
  aiSuggestions?: string[];
  onCollapse: () => void;
  focusSessions: number;
  // currentDay:boolean;
}

const ExpandedDayCard = ({
  index,
  dayName,
  date,
  tasks,
  mood,
  workingHours,
  sessions,
  selected,
  // currentDay,
  showBorder,
  focusSessions,
  onCollapse,
}: ExpandedDayCardProps) => {
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState(moodOptions[1]);
  const [sessionList, setSessionList] = useState<Session[]>(sessions ?? []);
  const [taskList, setTaskList] = useState(tasks);
  const completedTasks = taskList.filter((task) => task.completed).length;

  const totalTasks = taskList.length;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const toggleTask = (taskId: string) => {
    setTaskList((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessionList((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, title } : session
      )
    );
  };

  const toggleSession = (sessionId: string) => {
    setSessionList((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;

        if (session.status === "completed") return session;

        return {
          ...session,
          status: session.status === "active" ? "paused" : "active",
        };
      })
    );
  };

  const addSession = () => {
    setSessionList((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: `جلسة ${prev.length + 1}`,
        sessionDuration: 90,
        actualMinutes: 0,
        completed: false,
        status: "idle",
      },
    ]);
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionList((prev) =>
        prev.map((session) => {
          if (session.status !== "active") return session;

          const nextMinutes = session.actualMinutes + 1;

          if (nextMinutes >= session.sessionDuration) {
            return {
              ...session,
              actualMinutes: session.sessionDuration,
              completed: true,
              status: "completed",
            };
          }

          return {
            ...session,
            actualMinutes: nextMinutes,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={onCollapse}
      dir="rtl"
      className={cn(
        "flex flex-col overflow-hidden h-full bg-white expand-card hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ",
        index == 7 || "border-l border-zinc-200"
      )}
    >
      {/* Header */}
      <div className="bg-indigo-500 p-2 ">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">{dayName}</h3>

          <span className="text-sm opacity-90">{date}</span>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="text-sm">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className="flex flex-1 gap-1 p-3 bg-[var(--daycard-bg)] overflow-y-auto overflow-x-hidden"
        dir="rtl"
      >
        {/* Performance */}
        <section className="basis-[40%] min-w-72">
          <h4 className="mb-3 text-2xl font-semibold text-right">الأداء</h4>

          <div className="space-y-2 text-md">
            <div className="flex justify-between">
              <span>ساعات العمل</span>
              <span>{workingHours}</span>
            </div>

            <div className="flex justify-between">
              <span>جلسات التركيز</span>
              <span>{focusSessions}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>تقييم اليوم</span>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs text-white transition-all duration-500",
                    selectedMood.color
                  )}
                >
                  {selectedMood.value}
                </button>

                {open && (
                  <div
                    className="
                top-full  left-0  mt-2  w-32  border  rounded-lg  bg-white  shadow-lg  z-50  p-2  absolute "
                  >
                    <div className="space-y-2">
                      {moodOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMood(option);
                            setOpen(false);
                          }}
                          className="w-full text-right"
                        >
                          <span
                            className={cn(
                              "inline-block rounded-full px-3 py-1 text-xs text-white",
                              option.color
                            )}
                          >
                            {option.value}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* sessions  */}
          <section className="  mt-6  rounded-2xl  bg-zinc-200  p-2  opacity-0 sessions-enter">
            <h4 className="mb-5 text-xl font-semibold">الجلسات</h4>

            <div className="space-y-4 ">
              {sessionList.map((session, index) => {
                return (
                  <div
                    key={session.id}
                    className=" flex items-center justify-between  gap-1"
                  >
                    {/* Session Name */}
                    <div className="flex-1">
                      <input
                        value={session.title}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          updateSessionTitle(session.id, e.target.value)
                        }
                        className="w-full  bg-transparent outline-none text-[16px] font-semibold  "
                      />
                    </div>

                    {/* Timer Area */}
                    <div
                      className={cn(
                        "bg-inherit w-[65%] m-0 rounded-xl",
                        session.completed && "bg-green-500 relative"
                      )}
                    >
                      {session.completed ? (
                        <span className="absolute top-1 left-1 z-10 text-[15px] font-semibold">
                          مكتمل
                        </span>
                      ) : null}
                      <div className="  flex w-[70%] h-7.5 items-center text-sm overflow-hidden  rounded-xl  bg-white  border border-zinc-400">
                        {/* Play / Pause */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSession(session.id);
                          }}
                          className=" px-  py-1  hover:bg-zinc-100  transition-colors"
                        >
                          {session.status === "active" ? (
                            <Square
                              size={18}
                              className="text-green-600 "
                              fill="currentColor"
                            />
                          ) : (
                            <Play
                              size={18}
                              className="text-green-600 "
                              fill="currentColor"
                            />
                          )}
                        </button>

                        {/* Current Time */}
                        <span className="px-1 font-medium">
                          {formatMinutes(session.actualMinutes)}
                        </span>

                        <div className=" h-8 border-l border-zinc-300" />

                        {/* Estimated Time */}
                        <span className="px-1 font-medium">
                          {formatMinutes(session.sessionDuration)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Session */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addSession();
              }}
              className="mt-5  flex  items-center  gap-2  text-zinc-500  transition-colors  hover:text-indigo-600"
            >
              <Plus size={18} />
              <span>إضافة جلسة</span>
            </button>
          </section>
        </section>

        {/* Tasks */}

        <section className="mt-1 flex-1 min-w-0 text-right task-enter ">
          <div className="mb-4 flex items-center justify-between text-right">
            <h4 className="text-xl mr-10 text-right font-semibold">المهام</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="  text-zinc-500 ml-8 cursor-pointer  transition-colors  hover:text-indigo-500"
            >
              <Plus size={22} />
            </button>
          </div>

          <div className=" relative pb-4  pr-8 transition-all duration-500">
            {/* Vertical Line */}
            <div className="absolute right-2  -top-9 bottom-0 flex flex-col items-center">
              {/* Top Circle */}
              <div className="h-3 w-3 rounded-full bg-zinc-400" />

              {/* Line */}
              <div className="flex-1 w-1 bg-zinc-400" />

              {/* Bottom Circle */}
              <div className="h-3 w-3 rounded-full bg-zinc-400" />
            </div>

            {taskList.map((task) => {
              const style = categoryStyles[task.category];

              return (
                <div
                  key={task.id}
                  className="task-item relative mb-2 -mr-4 cursor-pointer flex items-center animate-[fadeIn_0.3s_ease]"
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                >
                  <div
                    className={cn(
                      " h-0.5 w-7 border-t-2 border-dashed",
                      style.dot.replace("bg-", "border-")
                    )}
                  />
                  {/* Task Card */}
                  <div
                    className={cn(
                      `relative flex-1 rounded-xl border-2 min-w-0 overflow-hidden bg-gray-200  p-2  pl-5 shadow-sm  transition-all  duration-300  hover:shadow-md  `,
                      style.border
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <button>
                        {task.completed ? (
                          <CheckSquare
                            size={22}
                            className=" text-emerald-500"
                          />
                        ) : (
                          <Square size={22} className=" text-zinc-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 overflow-hidden text-right">
                        <p
                          className={cn(
                            "text-[15px] transition-all duration-300 block overflow-hidden text-ellipsis whitespace-nowrap",
                            task.completed &&
                              "line-through text-zinc-500 opacity-60"
                          )}
                        >
                          {task.title}
                        </p>
                      </div>

                      {/* Timeline Dot */}
                      <div
                        className={cn(
                          "absolute left-1.5 top-3 z-10 h-3 w-3 rounded-full ",
                          style.dot
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExpandedDayCard;
