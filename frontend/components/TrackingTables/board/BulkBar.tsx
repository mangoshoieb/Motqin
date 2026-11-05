"use client";

import { Eraser, Send, Trash2, X } from "lucide-react";
import { formatNumber } from "@/app/lib/tracking-table";
import { TrackingColumn } from "@/app/types/tracking-table.types";
import { Dropdown } from "../ui";

// Floats at the bottom while students are ticked.
export function BulkBar({
  count,
  columns,
  canReport,
  canClear = true,
  canDelete = true,
  onReport,
  onClearColumn,
  onDelete,
  onCancel,
}: {
  count: number;
  columns: TrackingColumn[];
  canReport: boolean;
  // An assistant without EditRows / DeleteRows doesn't get those actions.
  canClear?: boolean;
  canDelete?: boolean;
  onReport: () => void;
  onClearColumn: (column: TrackingColumn) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  if (count === 0) return null;

  const action =
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-40";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div
        dir="rtl"
        className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-2xl bg-zinc-900 p-1.5 text-white shadow-2xl shadow-zinc-900/30 ring-1 ring-white/10 dark:bg-zinc-800"
      >
        <span className="px-3 text-sm font-bold">
          تم تحديد {formatNumber(count)} {count === 1 ? "طالب" : "طلاب"}
        </span>
        <span className="mx-1 h-6 w-px bg-white/15" />
        {canReport && (
          <button type="button" onClick={onReport} className={action}>
            <Send size={16} /> إرسال تقرير
          </button>
        )}
        {canClear && (
          <Dropdown
            trigger={
              <button type="button" disabled={columns.length === 0} className={action}>
                <Eraser size={16} /> مسح عمود
              </button>
            }
            items={columns.map((column) => ({ label: column.name, onSelect: () => onClearColumn(column) }))}
          />
        )}
        {canDelete && (
          <button type="button" onClick={onDelete} className={`${action} text-rose-300 hover:bg-rose-500/20`}>
            <Trash2 size={16} /> حذف
          </button>
        )}
        <button type="button" onClick={onCancel} aria-label="إلغاء التحديد" className={action}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
