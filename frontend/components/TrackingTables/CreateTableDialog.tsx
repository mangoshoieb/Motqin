"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import {
  COLUMN_TYPES,
  TABLE_COLORS,
  TABLE_COLOR_ORDER,
  TRACKING_LIMITS,
  type TableColor,
} from "@/app/constants/tracking-table.constants";
import { useCreateTable } from "@/app/hooks/useTrackingTables";
import { trackingTableService } from "@/app/services/tracking-table.service";
import { defaultView, useTableViewStore } from "@/app/lib/tracking-table-view.store";
import { SaveColumnBody } from "@/app/types/tracking-table.types";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";
import { Modal, inputClass, primaryButton, secondaryButton } from "./ui";
import { TeacherPicker } from "./TeacherPicker";

// Columns most groups start with; the teacher ticks the ones they want and
// can change or delete them later.
const STARTER_COLUMNS: { key: string; column: SaveColumnBody }[] = [
  { key: "attendance", column: { name: "الحضور", type: "YesNo" } },
  { key: "homework", column: { name: "الواجب", type: "YesNo" } },
  { key: "exam", column: { name: "امتحان 1", type: "Exam", maxScore: 20 } },
  {
    key: "level",
    column: { name: "المستوى", type: "Choice", options: ["ممتاز", "جيد جدًا", "جيد", "يحتاج متابعة"] },
  },
  { key: "notes", column: { name: "ملاحظات", type: "Text" } },
];

export function CreateTableDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState<TableColor>("blue");
  const [starters, setStarters] = useState<string[]>(["attendance", "homework", "exam"]);
  const [addingColumns, setAddingColumns] = useState(false);
  const createTable = useCreateTable();
  const updateView = useTableViewStore((s) => s.update);

  // An assistant creates tables for a teacher who gave them CreateTables.
  const { isTeacher, createFor } = useTrackingAccess();
  const [forTeacherId, setForTeacherId] = useState(isTeacher ? "" : createFor[0]?.teacherId ?? "");
  const link = createFor.find((l) => l.teacherId === forTeacherId);
  // Starter columns need EditTables on the teacher's side.
  const canAddColumns = !link || link.permissions.includes("EditTables");

  const trimmed = name.trim();
  const busy = createTable.isPending || addingColumns;

  const toggleStarter = (key: string) =>
    setStarters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || busy) return;

    const table = await createTable
      .mutateAsync({ groupName: trimmed, forTeacherId: forTeacherId || undefined })
      .catch(() => null);
    if (!table) return;
    updateView(table.groupId, { ...defaultView(table.groupId), color });

    // One at a time, so they keep the order shown here.
    setAddingColumns(true);
    try {
      const chosen = canAddColumns ? STARTER_COLUMNS.filter((s) => starters.includes(s.key)) : [];
      for (const { column } of chosen) {
        await trackingTableService.addColumn(table.groupId, column);
      }
    } catch {
      toast.error("تم إنشاء الجدول، لكن تعذر إضافة بعض الأعمدة الجاهزة");
    }
    router.push(`/tracking-tables/${table.groupId}`);
  };

  return (
    <Modal
      title="جدول متابعة جديد"
      description="جدول لكل مجموعة: الاسم ورقم الطالب ورقم ولي الأمر موجودة دائمًا."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="submit" form="create-table" disabled={!trimmed || busy} className={cn(primaryButton, "flex-1")}>
            {busy ? "جارٍ الإنشاء..." : "إنشاء الجدول"}
          </button>
        </>
      }
    >
      <form id="create-table" onSubmit={submit} className="flex flex-col gap-5">
        <TeacherPicker value={forTeacherId} onChange={setForTeacherId} isTeacher={isTeacher} links={createFor} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">اسم المجموعة</span>
          <input
            autoFocus
            dir="auto"
            value={name}
            maxLength={TRACKING_LIMITS.TABLE_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: السبت 4 م — الصف الثالث"
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">لون الجدول</span>
          <div className="flex flex-wrap gap-2">
            {TABLE_COLOR_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                title={TABLE_COLORS[key].label}
                onClick={() => setColor(key)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full bg-gradient-to-br text-white transition",
                  TABLE_COLORS[key].gradient,
                  color === key ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-white dark:ring-offset-zinc-900" : "hover:scale-110",
                )}
              >
                {color === key && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        {canAddColumns && <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ابدأ بأعمدة جاهزة</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {STARTER_COLUMNS.map(({ key, column }) => {
              const { Icon, label } = COLUMN_TYPES[column.type];
              const on = starters.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleStarter(key)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-start transition",
                    on
                      ? "border-blue-500 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-500/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      on ? "bg-blue-600 dark:bg-blue-700 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{column.name}</span>
                    <span className="block text-xs text-zinc-500">
                      {label}
                      {column.maxScore ? ` من ${column.maxScore}` : ""}
                    </span>
                  </span>
                  {on && <Check size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>}
      </form>
    </Modal>
  );
}

// Rename a table: one field.
export function RenameTableDialog({
  initialName,
  isPending,
  onSubmit,
  onClose,
}: {
  initialName: string;
  isPending: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const disabled = !trimmed || trimmed === initialName || isPending;

  return (
    <Modal
      title="تغيير اسم الجدول"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="submit" form="rename-table" disabled={disabled} className={cn(primaryButton, "flex-1")}>
            {isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </>
      }
    >
      <form
        id="rename-table"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled) onSubmit(trimmed);
        }}
      >
        <input
          autoFocus
          dir="auto"
          value={name}
          maxLength={TRACKING_LIMITS.TABLE_NAME}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </form>
    </Modal>
  );
}
