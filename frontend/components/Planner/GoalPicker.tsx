"use client";

import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Plus, Search, Target, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/app/lib/utils";
import { useCreateUserGoal, useUserGoals } from "@/app/hooks/useUserGoals";
import { UserGoal } from "@/app/services/motqin";

// The list is always tall enough to show this many goals before scrolling,
// and the search box only appears once there are more than this to sift.
const MIN_VISIBLE_GOALS = 3;

interface GoalPickerProps {
  value: number | null;
  onChange: (goalId: number | null, goal: UserGoal | null) => void;
  placeholder?: string;
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
}

const fieldClass =
  "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-blue-950";

export function GoalPicker({
  value,
  onChange,
  placeholder = "اختر الهدف",
  size = "default",
  className,
  disabled,
}: GoalPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const { data: goals = [], isLoading } = useUserGoals();

  const selected = goals.find((goal) => goal.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return goals;
    return goals.filter((goal) => goal.title.toLowerCase().includes(q));
  }, [goals, query]);

  const showSearch = goals.length > MIN_VISIBLE_GOALS;

  const resetAddForm = () => {
    setAdding(false);
    setNewTitle("");
    setNewStart("");
    setNewEnd("");
  };

  const createGoal = useCreateUserGoal((created) => {
    toast.success("تمت إضافة الهدف");
    resetAddForm();
    setQuery("");
    if (created?.id) {
      onChange(created.id, created);
      setOpen(false);
    }
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      resetAddForm();
    }
  };

  const submitNewGoal = () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error("عنوان الهدف مطلوب.");
      return;
    }
    if (newStart && newEnd && newEnd < newStart) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية.");
      return;
    }
    createGoal.mutate(
      {
        title,
        startDate: newStart || null,
        endDate: newEnd || null,
      },
      { onError: () => toast.error("تعذر إضافة الهدف.") },
    );
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 text-sm whitespace-nowrap outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-8" : "h-9",
          className,
        )}
      >
        <span
          className={cn(
            "flex flex-1 items-center gap-1.5 truncate text-right",
            !selected && "text-muted-foreground",
          )}
        >
          <Target size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="truncate">
            {selected ? selected.title : isLoading ? "جارِ التحميل..." : placeholder}
          </span>
        </span>
        <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={4} align="start" className="isolate z-[60]">
          <Popover.Popup
            dir="rtl"
            className="w-(--anchor-width) min-w-72 origin-(--transform-origin) rounded-3xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            {adding ? (
              <div className="space-y-3 p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    هدف جديد
                  </span>
                  <button
                    type="button"
                    onClick={resetAddForm}
                    title="رجوع"
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    عنوان الهدف
                  </label>
                  <input
                    autoFocus
                    value={newTitle}
                    maxLength={250}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitNewGoal();
                      }
                    }}
                    placeholder="مثال: إتقان الفصل الأول في الفيزياء"
                    className={fieldClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      تاريخ البداية
                    </label>
                    <input
                      type="date"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      تاريخ النهاية
                    </label>
                    <input
                      type="date"
                      value={newEnd}
                      min={newStart || undefined}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitNewGoal}
                  disabled={createGoal.isPending || !newTitle.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} />
                  {createGoal.isPending ? "جاري الحفظ..." : "حفظ الهدف"}
                </button>
              </div>
            ) : (
              <>
                {showSearch && (
                  <div className="relative mb-1.5">
                    <Search
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ابحث عن هدف..."
                      className={cn(fieldClass, "rounded-2xl pr-9")}
                    />
                  </div>
                )}

                {/* ~4.5 rows of 44px — comfortably above MIN_VISIBLE_GOALS before scrolling. */}
                <ul role="listbox" className="max-h-52 overflow-y-auto">
                  {isLoading ? (
                    <li className="px-3 py-3 text-center text-xs text-zinc-400">
                      جارِ تحميل الأهداف...
                    </li>
                  ) : filtered.length === 0 ? (
                    <li className="px-3 py-3 text-center text-xs text-zinc-400">
                      {goals.length === 0
                        ? "لا توجد أهداف بعد — أضف هدفك الأول."
                        : "لا توجد نتائج مطابقة."}
                    </li>
                  ) : (
                    filtered.map((goal) => {
                      const isSelected = goal.id === value;
                      return (
                        <li key={goal.id} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(goal.id, goal);
                              setOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-right text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
                              isSelected && "bg-accent/60",
                            )}
                          >
                            <span className="flex-1 truncate">{goal.title}</span>
                            {(goal.startDate || goal.endDate) && (
                              <span className="shrink-0 text-[10px] text-zinc-400">
                                {goal.startDate ?? "…"} ← {goal.endDate ?? "…"}
                              </span>
                            )}
                            {isSelected && (
                              <Check size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                            )}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>

                <div className="mt-1.5 border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                  >
                    <Plus size={16} />
                    إضافة هدف
                  </button>
                </div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
