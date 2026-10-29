"use client";

import { Check, Eye, EyeOff, Palette } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  TABLE_COLORS,
  TABLE_COLOR_ORDER,
  TABLE_DENSITIES,
  TABLE_DENSITY_ORDER,
  type TableDensity,
} from "@/app/constants/tracking-table.constants";
import { useTableView, useTableViewStore } from "@/app/lib/tracking-table-view.store";
import { GridField } from "@/app/lib/tracking-table";
import { Popover, Segmented, secondaryButton } from "../ui";

// The whole table's look on this device: accent color, row size, and which
// columns are shown. Hiding only changes the view; delete is in the column
// menu.
export function AppearancePopover({ groupId, fields }: { groupId: string; fields: GridField[] }) {
  const view = useTableView(groupId);
  const update = useTableViewStore((s) => s.update);
  const toggleHidden = useTableViewStore((s) => s.toggleHidden);
  // The name is what makes a row readable; it always stays.
  const hideable = fields.filter((f) => f.id !== "name");

  return (
    <Popover
      align="end"
      className="w-72 p-3"
      trigger={
        <button type="button" className={secondaryButton}>
          <Palette size={17} />
          <span className="hidden sm:inline">المظهر</span>
          {view.hidden.length > 0 && (
            <span className="rounded-full bg-zinc-200 px-1.5 text-[11px] font-bold tabular-nums text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              {view.hidden.length}
            </span>
          )}
        </button>
      }
    >
      <p className="mb-2 text-xs font-bold text-zinc-500">لون الجدول</p>
      <div className="grid grid-cols-8 gap-1.5">
        {TABLE_COLOR_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            title={TABLE_COLORS[key].label}
            onClick={() => update(groupId, { color: key })}
            className={cn(
              "flex aspect-square items-center justify-center rounded-full bg-gradient-to-br text-white transition hover:scale-110",
              TABLE_COLORS[key].gradient,
              view.color === key && "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-900",
            )}
          >
            {view.color === key && <Check size={12} />}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-4 text-xs font-bold text-zinc-500">حجم الصفوف</p>
      <Segmented<TableDensity>
        value={view.density}
        onChange={(density) => update(groupId, { density })}
        options={TABLE_DENSITY_ORDER.map((d) => ({ value: d, label: TABLE_DENSITIES[d].label }))}
      />

      <p className="mb-1 mt-4 text-xs font-bold text-zinc-500">الأعمدة الظاهرة</p>
      <div className="max-h-56 overflow-y-auto">
        {hideable.map((field) => {
          const hidden = view.hidden.includes(field.id);
          return (
            <button
              key={field.id}
              type="button"
              onClick={() => toggleHidden(groupId, field.id)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {hidden ? (
                <EyeOff size={16} className="text-zinc-400" />
              ) : (
                <Eye size={16} className="text-blue-600 dark:text-blue-400" />
              )}
              <span className={cn("flex-1 truncate", hidden && "text-zinc-400 line-through")}>{field.label}</span>
            </button>
          );
        })}
      </div>
    </Popover>
  );
}
