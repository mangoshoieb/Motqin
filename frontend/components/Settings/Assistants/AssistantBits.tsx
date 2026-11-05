"use client";

import { Eye, Table2 } from "lucide-react";
import { useAssistantPermissions } from "@/app/hooks/useLookups";
import { AssistantPermission, SharedTableRef } from "@/app/types/tracking-table.types";

// The permissions as chips, in the lookup's display order. None = view only.
export const PermissionChips = ({ permissions }: { permissions: AssistantPermission[] }) => {
  const all = useAssistantPermissions();
  const granted = all.filter((item) => permissions.includes(item.key));

  if (granted.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <Eye size={12} />
        عرض فقط
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {granted.map((item) => (
        <span
          key={item.key}
          className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
        >
          {item.nameAr}
        </span>
      ))}
    </div>
  );
};

export const SharedTables = ({ allTables, tables }: { allTables: boolean; tables: SharedTableRef[] }) => (
  <p className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
    <Table2 size={14} className="mt-0.5 shrink-0 text-zinc-400" />
    {allTables ? (
      <span className="font-semibold">كل الجداول، ومنها ما يُنشأ لاحقًا</span>
    ) : tables.length === 0 ? (
      <span className="text-zinc-500">لا جداول مشاركة الآن</span>
    ) : (
      <span>{tables.map((table) => table.groupName).join("، ")}</span>
    )}
  </p>
);
