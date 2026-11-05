"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  BellOff,
  BellRing,
  ChevronDown,
  EyeOff,
  GripVertical,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  COLUMN_TYPES,
  TABLE_COLORS,
  TABLE_DENSITIES,
  TRACKING_LIMITS,
} from "@/app/constants/tracking-table.constants";
import {
  GridField,
  fieldType,
  formatNumber,
  normalizeDigits,
  summarizeColumn,
} from "@/app/lib/tracking-table";
import { TableView } from "@/app/lib/tracking-table-view.store";
import { useAddRow } from "@/app/hooks/useTrackingTables";
import { CellValue, ColumnType, RowSort, TrackingColumn, TrackingRow } from "@/app/types/tracking-table.types";
import { Dropdown, type MenuEntry } from "../ui";
import { Cell } from "./Cell";

const WIDTHS: Record<ColumnType | "Phone" | "Name", string> = {
  Name: "min-w-40 sm:min-w-56",
  Phone: "min-w-40",
  Text: "min-w-56",
  Number: "min-w-28",
  Exam: "min-w-40",
  Date: "min-w-36",
  YesNo: "min-w-28",
  Choice: "min-w-40",
};

const widthOf = (field: GridField) => (field.id === "name" ? WIDTHS.Name : WIDTHS[fieldType(field)]);

function FieldIcon({ field, className }: { field: GridField; className: string }) {
  if (field.kind === "column") {
    const { Icon } = COLUMN_TYPES[field.column.type];
    return <Icon size={14} className={className} />;
  }
  return field.id === "name" ? <User size={14} className={className} /> : <Phone size={14} className={className} />;
}

// Opaque backgrounds: sticky cells must hide what scrolls under them.
const cellBg =
  "bg-white group-hover/row:bg-zinc-50 dark:bg-zinc-900 dark:group-hover/row:bg-zinc-800";
const selectedBg = "bg-blue-50 group-hover/row:bg-blue-50 dark:bg-blue-950 dark:group-hover/row:bg-blue-950";
const headBg = "bg-zinc-50 dark:bg-zinc-900";

export interface GridProps {
  groupId: string;
  fields: GridField[]; // visible ones, in order
  rows: TrackingRow[];
  total: number;
  view: TableView;
  sort: RowSort | null;
  loading: boolean;
  filtered: boolean;
  selected: Set<number>;
  onToggleRow: (rowId: number) => void;
  onToggleAll: () => void;
  onSort: (sort: RowSort | null) => void;
  onAddColumn: () => void;
  onEditColumn: (column: TrackingColumn) => void;
  onDeleteColumn: (column: TrackingColumn) => void;
  onHideField: (fieldId: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onSaveCell: (row: TrackingRow, field: GridField, value: CellValue) => void;
  onToggleMessages: (row: TrackingRow) => void;
  onDeleteRow: (row: TrackingRow) => void;
  // What an assistant may do on this shared table; everything when omitted.
  permissions?: GridPermissions;
}

export interface GridPermissions {
  editTables: boolean; // add / edit / delete / reorder columns
  addRows: boolean;
  editRows: boolean; // cells and parent-message switch
  deleteRows: boolean;
}

const ALL_ALLOWED: GridPermissions = { editTables: true, addRows: true, editRows: true, deleteRows: true };

export function Grid(props: GridProps) {
  const { fields, rows, view, selected, loading } = props;
  const can = props.permissions ?? ALL_ALLOWED;
  const density = TABLE_DENSITIES[view.density];
  const color = TABLE_COLORS[view.color];
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selected.has(r.id));
  const [nameField, ...restFields] = fields;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={cn("h-1.5 bg-gradient-to-l", color.gradient)} />
      <div className="max-h-[calc(100vh-17rem)] min-h-64 overflow-auto">
        <table className={cn("w-max min-w-full border-separate border-spacing-0", density.text)}>
          <thead>
            <tr>
              <th className={cn("sticky start-0 top-0 z-30 w-11 min-w-11 border-b border-zinc-200 dark:border-zinc-800", headBg)}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={props.onToggleAll}
                  label="تحديد الكل"
                  accent={color.text}
                />
              </th>
              {nameField && (
                <HeaderCell
                  {...props}
                  field={nameField}
                  sticky
                  dragging={false}
                  over={false}
                  iconClass={color.text}
                  cellClass={density.cell}
                />
              )}
              {restFields.map((field) => (
                <HeaderCell
                  key={field.id}
                  {...props}
                  field={field}
                  iconClass={color.text}
                  cellClass={density.cell}
                  dragging={dragId === field.id}
                  over={overId === field.id && dragId !== field.id}
                  onDragStart={() => setDragId(field.id)}
                  onDragEnter={() => dragId && setOverId(field.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDrop={() => {
                    if (dragId && dragId !== field.id) props.onReorder(dragId, field.id);
                    setDragId(null);
                    setOverId(null);
                  }}
                />
              ))}
              <th className={cn("sticky top-0 z-20 w-full border-b border-zinc-200 px-2 text-start dark:border-zinc-800", headBg)}>
                {can.editTables && (
                  <button
                    type="button"
                    onClick={props.onAddColumn}
                    title="إضافة عمود"
                    className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Plus size={16} /> عمود
                  </button>
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && rows.length === 0
              ? [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td colSpan={fields.length + 2} className={cn("border-b border-zinc-100 dark:border-zinc-800", density.row)}>
                      <div className="mx-4 h-3 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" style={{ width: `${70 - i * 8}%` }} />
                    </td>
                  </tr>
                ))
              : rows.map((row) => {
                  const isSelected = selected.has(row.id);
                  const bg = isSelected ? selectedBg : cellBg;
                  return (
                    <tr key={row.id} className="group/row">
                      <td className={cn("sticky start-0 z-10 w-11 min-w-11 border-b border-zinc-100 text-center dark:border-zinc-800", bg, density.row)}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => props.onToggleRow(row.id)}
                          label={`تحديد ${row.fullName}`}
                          accent={color.text}
                        />
                      </td>
                      {fields.map((field, index) => (
                        <td
                          key={field.id}
                          className={cn(
                            "border-b border-zinc-100 dark:border-zinc-800",
                            widthOf(field),
                            density.row,
                            density.cell,
                            bg,
                            index === 0 &&
                              "sticky start-11 z-10 border-e border-e-zinc-200 font-semibold text-zinc-900 dark:border-e-zinc-800 dark:text-zinc-100",
                          )}
                        >
                          {index === 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="min-w-0 flex-1">
                                <Cell row={row} field={field} readOnly={!can.editRows} onSave={(v) => props.onSaveCell(row, field, v)} />
                              </div>
                              {row.noParentMessages && (
                                <span title="ولي الأمر لا يستقبل رسائل">
                                  <BellOff size={14} className="shrink-0 text-amber-500" />
                                </span>
                              )}
                              <RowMenu row={row} {...props} />
                            </div>
                          ) : (
                            <Cell row={row} field={field} readOnly={!can.editRows} onSave={(v) => props.onSaveCell(row, field, v)} />
                          )}
                        </td>
                      ))}
                      <td className={cn("border-b border-zinc-100 dark:border-zinc-800", bg)} />
                    </tr>
                  );
                })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={fields.length + 2} className="px-6 py-12 text-center text-sm text-zinc-500">
                  {props.filtered
                    ? "لا يوجد طلاب يطابقون البحث أو التصفية."
                    : can.addRows
                      ? "لا يوجد طلاب بعد. أضف أول طالب من الصف بالأسفل."
                      : "لا يوجد طلاب بعد."}
                </td>
              </tr>
            )}

            {can.addRows && <AddStudentRow groupId={props.groupId} fields={fields} density={density} />}
          </tbody>

          {rows.length > 0 && <SummaryRow fields={fields} rows={rows} total={props.total} cellClass={density.cell} />}
        </table>
      </div>
    </div>
  );
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
  accent,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  accent: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={onChange}
      className={cn("size-4 cursor-pointer rounded accent-current", accent)}
    />
  );
}

function HeaderCell({
  field,
  sort,
  sticky,
  dragging,
  over,
  iconClass,
  cellClass,
  onSort,
  onEditColumn,
  onDeleteColumn,
  onHideField,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  permissions,
}: GridProps & {
  field: GridField;
  sticky?: boolean;
  dragging: boolean;
  over: boolean;
  iconClass: string;
  cellClass: string;
  onDragStart?: () => void;
  onDragEnter?: () => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) {
  const sorted = sort?.field === field.id ? sort : null;
  // Sorting and hiding are the viewer's own; changing columns needs EditTables.
  const column = field.kind === "column" && (permissions ?? ALL_ALLOWED).editTables ? field.column : null;
  const examMax = field.kind === "column" && field.column.type === "Exam" ? field.column.maxScore : null;
  const draggable = !!column;

  const items: MenuEntry[] = [
    {
      label: "ترتيب تصاعدي",
      Icon: ArrowUp,
      active: sorted?.desc === false,
      onSelect: () => onSort({ field: field.id, desc: false }),
    },
    {
      label: "ترتيب تنازلي",
      Icon: ArrowDown,
      active: sorted?.desc === true,
      onSelect: () => onSort({ field: field.id, desc: true }),
    },
  ];
  if (sorted) items.push({ label: "إلغاء الترتيب", onSelect: () => onSort(null) });
  if (column) {
    items.push({ label: "تعديل العمود", Icon: Pencil, separatorBefore: true, onSelect: () => onEditColumn(column) });
  }
  if (field.id !== "name") {
    items.push({ label: "إخفاء من العرض", Icon: EyeOff, separatorBefore: !column, onSelect: () => onHideField(field.id) });
  }
  if (column) {
    items.push({ label: "حذف العمود", Icon: Trash2, danger: true, onSelect: () => onDeleteColumn(column) });
  }

  return (
    <th
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnter={onDragEnter}
      onDragOver={(e) => draggable && e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={cn(
        "group/head sticky top-0 border-b border-zinc-200 py-2 text-start align-middle font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300",
        headBg,
        widthOf(field),
        cellClass,
        sticky ? "start-11 z-30 border-e border-e-zinc-200 dark:border-e-zinc-800" : "z-20",
        dragging && "opacity-40",
        over && "shadow-[inset_-3px_0_0_0] shadow-blue-500",
      )}
    >
      <Dropdown
        items={items}
        header={
          examMax ? (
            <p className="px-3 pb-1 pt-1.5 text-xs text-zinc-500">من {formatNumber(examMax)} درجة</p>
          ) : undefined
        }
        trigger={
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded-lg py-1 text-start text-xs font-bold outline-none hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {draggable && (
              <GripVertical size={14} className="-ms-1 shrink-0 cursor-grab text-zinc-300 opacity-0 transition group-hover/head:opacity-100" />
            )}
            <FieldIcon field={field} className={cn("shrink-0", iconClass)} />
            <span className="truncate">{field.label}</span>
            {sorted ? (
              sorted.desc ? (
                <ArrowDown size={13} className="shrink-0 text-blue-600" />
              ) : (
                <ArrowUp size={13} className="shrink-0 text-blue-600" />
              )
            ) : (
              <ChevronDown size={13} className="shrink-0 opacity-0 transition group-hover/head:opacity-60" />
            )}
          </button>
        }
      />
    </th>
  );
}

function RowMenu({
  row,
  onToggleMessages,
  onDeleteRow,
  permissions,
}: GridProps & { row: TrackingRow }) {
  const can = permissions ?? ALL_ALLOWED;
  const items: MenuEntry[] = [];
  if (can.editRows) {
    items.push(
      row.noParentMessages
        ? { label: "تفعيل رسائل ولي الأمر", Icon: BellRing, onSelect: () => onToggleMessages(row) }
        : { label: "إيقاف رسائل ولي الأمر", Icon: BellOff, onSelect: () => onToggleMessages(row) },
    );
  }
  if (can.deleteRows) {
    items.push({ label: "حذف الطالب", Icon: Trash2, danger: true, separatorBefore: items.length > 0, onSelect: () => onDeleteRow(row) });
  }
  if (items.length === 0) return null;

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          aria-label="خيارات الطالب"
          className="shrink-0 rounded-md p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-700 focus:opacity-100 group-hover/row:opacity-100 data-[popup-open]:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          <MoreHorizontal size={16} />
        </button>
      }
      items={items}
    />
  );
}

// The last row: type a name (and phones) and press Enter. It stays open for
// the next student, so a whole class goes in quickly.
function AddStudentRow({
  groupId,
  fields,
  density,
}: {
  groupId: string;
  fields: GridField[];
  density: (typeof TABLE_DENSITIES)[keyof typeof TABLE_DENSITIES];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", studentPhone: "", parentPhone: "" });
  const nameRef = useRef<HTMLInputElement>(null);
  const addRow = useAddRow(groupId);

  const save = () => {
    const fullName = draft.name.trim();
    if (!fullName || addRow.isPending) return;
    addRow.mutate(
      {
        fullName,
        studentPhone: normalizeDigits(draft.studentPhone.trim()) || null,
        parentPhone: normalizeDigits(draft.parentPhone.trim()) || null,
        noParentMessages: false,
      },
      {
        onSuccess: () => {
          setDraft({ name: "", studentPhone: "", parentPhone: "" });
          nameRef.current?.focus();
        },
      },
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const input =
    "h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950";

  if (!open) {
    return (
      <tr>
        <td colSpan={fields.length + 2} className="p-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="sticky start-0 flex h-11 items-center gap-2 px-4 text-sm font-semibold text-zinc-500 transition hover:text-blue-600"
          >
            <Plus size={16} /> إضافة طالب
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50/50 dark:bg-blue-950/30">
      <td className="sticky start-0 z-10 w-11 border-b border-zinc-100 bg-blue-50 text-center dark:border-zinc-800 dark:bg-blue-950">
        <Plus size={16} className="mx-auto text-blue-600" />
      </td>
      {fields.map((field, index) => (
        <td
          key={field.id}
          className={cn(
            "border-b border-zinc-100 dark:border-zinc-800",
            density.row,
            density.cell,
            index === 0 && "sticky start-11 z-10 border-e border-e-zinc-200 bg-blue-50 dark:border-e-zinc-800 dark:bg-blue-950",
          )}
        >
          {field.kind === "core" ? (
            <input
              ref={field.id === "name" ? nameRef : undefined}
              autoFocus={field.id === "name"}
              dir={field.id === "name" ? "auto" : "ltr"}
              inputMode={field.id === "name" ? undefined : "tel"}
              maxLength={field.id === "name" ? TRACKING_LIMITS.STUDENT_NAME : 20}
              placeholder={field.id === "name" ? "اسم الطالب ثم Enter" : "01xxxxxxxxx"}
              value={draft[field.id]}
              onChange={(e) => setDraft((prev) => ({ ...prev, [field.id]: e.target.value }))}
              onKeyDown={onKeyDown}
              className={input}
            />
          ) : null}
        </td>
      ))}
      <td className="border-b border-zinc-100 px-2 dark:border-zinc-800">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={save}
            disabled={!draft.name.trim() || addRow.isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {addRow.isPending ? "..." : "إضافة"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            إغلاق
          </button>
        </div>
      </td>
    </tr>
  );
}

// Footer: how each column is doing over the students on screen.
function SummaryRow({
  fields,
  rows,
  total,
  cellClass,
}: {
  fields: GridField[];
  rows: TrackingRow[];
  total: number;
  cellClass: string;
}) {
  const partial = total > rows.length;
  return (
    <tfoot>
      <tr>
        <td className={cn("sticky bottom-0 start-0 z-20 border-t border-zinc-200 dark:border-zinc-800", headBg)} />
        {fields.map((field, index) => {
          let primary = "";
          let secondary: string | undefined;
          if (index === 0) {
            primary = partial ? "ملخص الصفحة" : "الملخص";
            secondary = `${formatNumber(rows.length)} طالب`;
          } else if (field.kind === "column") {
            const summary = summarizeColumn(field.column, rows);
            primary = summary?.primary ?? "";
            secondary = summary?.secondary;
          } else {
            const count = rows.filter((r) => r[field.id as "studentPhone" | "parentPhone"]).length;
            primary = `مسجل ${formatNumber(count)} / ${formatNumber(rows.length)}`;
          }
          return (
            <td
              key={field.id}
              className={cn(
                "sticky bottom-0 z-10 border-t border-zinc-200 py-2 align-top dark:border-zinc-800",
                headBg,
                cellClass,
                index === 0 && "start-11 z-20 border-e border-e-zinc-200 dark:border-e-zinc-800",
              )}
            >
              <p className={cn("truncate text-xs font-bold", index === 0 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300")}>
                {primary}
              </p>
              {secondary && <p className="truncate text-[11px] text-zinc-500">{secondary}</p>}
            </td>
          );
        })}
        <td className={cn("sticky bottom-0 z-10 border-t border-zinc-200 dark:border-zinc-800", headBg)} />
      </tr>
    </tfoot>
  );
}
