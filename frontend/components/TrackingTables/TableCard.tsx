"use client";

import { useState } from "react";
import Link from "next/link";
import { Columns3, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { TABLE_COLORS } from "@/app/constants/tracking-table.constants";
import { useTableView } from "@/app/lib/tracking-table-view.store";
import { formatNumber, tableInitial } from "@/app/lib/tracking-table";
import { useDeleteTable, useRenameTable, useRestoreTable } from "@/app/hooks/useTrackingTables";
import { TrackingTableSummary } from "@/app/types/tracking-table.types";
import { canOnTable, isOwnTable } from "@/app/lib/tracking-table";
import { RenameTableDialog } from "./CreateTableDialog";
import { Dropdown } from "./ui";

const relative = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

const timeAgo = (iso: string) => {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (!Number.isFinite(minutes)) return "";
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
};

export function TableCard({ table }: { table: TrackingTableSummary }) {
  const view = useTableView(table.groupId);
  const color = TABLE_COLORS[view.color];
  const [renaming, setRenaming] = useState(false);
  const rename = useRenameTable(table.groupId);
  const remove = useDeleteTable();
  const restore = useRestoreTable();
  // On a shared table, only what the teacher allowed.
  const canRename = canOnTable(table, "EditTables");
  const canDelete = canOnTable(table, "DeleteTables");
  const menu = [
    ...(canRename ? [{ label: "تغيير الاسم", Icon: Pencil, onSelect: () => setRenaming(true) }] : []),
    ...(canDelete
      ? [{ label: "حذف الجدول", Icon: Trash2, danger: true, separatorBefore: canRename, onSelect: () => deleteTable() }]
      : []),
  ];

  const deleteTable = () =>
    remove.mutate(table.groupId, {
      onSuccess: () =>
        toast.success(`تم حذف "${table.groupName}"`, {
          action: { label: "تراجع", onClick: () => restore.mutate(table.groupId) },
        }),
    });

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className={cn("h-2 bg-gradient-to-l", color.gradient)} />
      <Link href={`/tracking-tables/${table.groupId}`} className="block p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-sm",
              color.gradient,
            )}
          >
            {tableInitial(table.groupName)}
          </span>
          <div className="min-w-0 flex-1 pe-8">
            <h3 className="truncate text-base font-bold text-zinc-900 dark:text-zinc-100">{table.groupName}</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {!isOwnTable(table) && table.teacher ? `${table.teacher.name} · ` : ""}
              آخر تعديل {timeAgo(table.updatedAt)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", color.soft, color.text)}>
            <Users size={14} /> {formatNumber(table.rows)} طالب
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Columns3 size={14} /> {formatNumber(table.columns)} عمود
          </span>
        </div>
      </Link>

      {menu.length > 0 && (
        <div className="absolute end-3 top-5">
          <Dropdown
            align="end"
            trigger={
              <button
                type="button"
                aria-label="خيارات الجدول"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <MoreHorizontal size={18} />
              </button>
            }
            items={menu}
          />
        </div>
      )}

      {renaming && (
        <RenameTableDialog
          initialName={table.groupName}
          isPending={rename.isPending}
          onClose={() => setRenaming(false)}
          onSubmit={(name) => rename.mutate(name, { onSuccess: () => setRenaming(false) })}
        />
      )}
    </div>
  );
}
