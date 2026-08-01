"use client";

import { Plus, X } from "lucide-react";
import { BusyTimeEntry, BusyTimesByDay, WEEKDAYS, WeekDay } from "@/app/types/planner-preferences.types";

interface BusyTimesEditorProps {
  value: BusyTimesByDay;
  onChange: (value: BusyTimesByDay) => void;
}

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

// Per-weekday repeatable list of busy ranges — each entry is either a
// specific start-end range or, via the "all day" checkbox, the whole day
// (covers both "busy from 1 to 6" and a full rest day with one mechanism).
export const BusyTimesEditor = ({ value, onChange }: BusyTimesEditorProps) => {
  const addEntry = (day: WeekDay) => {
    const entry: BusyTimeEntry = {
      id: crypto.randomUUID(),
      allDay: false,
      range: { start: "09:00", end: "10:00" },
    };
    onChange({ ...value, [day]: [...value[day], entry] });
  };

  const updateEntry = (day: WeekDay, id: string, patch: Partial<BusyTimeEntry>) => {
    onChange({
      ...value,
      [day]: value[day].map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    });
  };

  const removeEntry = (day: WeekDay, id: string) => {
    onChange({ ...value, [day]: value[day].filter((entry) => entry.id !== id) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {WEEKDAYS.map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{label}</p>

          <div className="flex flex-col gap-2">
            {value[key].map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={entry.allDay}
                    onChange={(e) => updateEntry(key, entry.id, { allDay: e.target.checked })}
                  />
                  كل اليوم
                </label>

                {!entry.allDay && (
                  <>
                    <input
                      type="time"
                      value={entry.range.start}
                      onChange={(e) =>
                        updateEntry(key, entry.id, { range: { ...entry.range, start: e.target.value } })
                      }
                      className={inputClass}
                    />
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">إلى</span>
                    <input
                      type="time"
                      value={entry.range.end}
                      onChange={(e) =>
                        updateEntry(key, entry.id, { range: { ...entry.range, end: e.target.value } })
                      }
                      className={inputClass}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => removeEntry(key, entry.id)}
                  title="حذف"
                  className="text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addEntry(key)}
              className="flex items-center gap-1 self-start text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              <Plus size={14} /> إضافة وقت مشغول
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
