"use client";

import { AssistingLink } from "@/app/types/tracking-table.types";
import { inputClass } from "./ui";

// "For which teacher?" — shown to assistants when creating or importing a
// table. The table belongs to the chosen teacher and counts against their
// limits. "" is the user's own (teachers only).
export function TeacherPicker({
  value,
  onChange,
  isTeacher,
  links,
}: {
  value: string;
  onChange: (teacherId: string) => void;
  isTeacher: boolean;
  links: AssistingLink[];
}) {
  if (links.length === 0) return null;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">لمن الجدول؟</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {isTeacher && <option value="">جداولي</option>}
        {links.map((link) => (
          <option key={link.teacherId} value={link.teacherId}>
            {link.teacherName}
          </option>
        ))}
      </select>
      {value && (
        <span className="text-xs text-zinc-500">يصبح الجدول من جداول هذا المعلم، ويُحسب من حدوده.</span>
      )}
    </label>
  );
}
