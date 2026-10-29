"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { getApiErrorStatus } from "@/app/lib/api-error";
import {
  CORE_FIELDS,
  ROWS_PAGE_SIZE,
  TABLE_COLORS,
} from "@/app/constants/tracking-table.constants";
import {
  GridField,
  columnField,
  coreField,
  describeFilter,
  downloadBlob,
  formatNumber,
  safeFileName,
  tableInitial,
} from "@/app/lib/tracking-table";
import { useTableView, useTableViewStore } from "@/app/lib/tracking-table-view.store";
import {
  useClearColumn,
  useDeleteColumn,
  useDeleteRows,
  useDeleteTable,
  useExportTable,
  useRenameTable,
  useReorderColumns,
  useReportTemplates,
  useRestoreColumn,
  useRestoreRows,
  useRestoreTable,
  useTableRows,
  useUpdateRow,
} from "@/app/hooks/useTrackingTables";
import {
  CellValue,
  RowFilter,
  RowSort,
  SaveRowBody,
  TrackingColumn,
  TrackingRow,
} from "@/app/types/tracking-table.types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Skeleton from "@/components/ui/Skeleton";
import { Grid } from "@/components/TrackingTables/board/Grid";
import { ColumnDialog } from "@/components/TrackingTables/board/ColumnDialog";
import { FilterPopover } from "@/components/TrackingTables/board/FilterPopover";
import { AppearancePopover } from "@/components/TrackingTables/board/AppearancePopover";
import { BulkBar } from "@/components/TrackingTables/board/BulkBar";
import { CoreFieldsDialog } from "@/components/TrackingTables/board/CoreFieldsDialog";
import { RenameTableDialog } from "@/components/TrackingTables/CreateTableDialog";
import { ReportDialog } from "@/components/TrackingTables/reports/ReportDialog";
import { Dropdown, ghostButton, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

type DialogState =
  | { kind: "column"; column?: TrackingColumn }
  | { kind: "report"; rowIds: number[] | null }
  | { kind: "rename" }
  | { kind: "coreFields" }
  | { kind: "confirm"; title: string; message: string; confirmLabel: string; onConfirm: () => void }
  | null;

const rowBody = (row: TrackingRow): SaveRowBody => ({
  fullName: row.fullName,
  studentPhone: row.studentPhone,
  parentPhone: row.parentPhone,
  noParentMessages: row.noParentMessages,
});

export default function TrackingTableBoardPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const view = useTableView(groupId);
  const toggleHidden = useTableViewStore((s) => s.toggleHidden);
  const color = TABLE_COLORS[view.color];

  // --- What the grid shows ---
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RowFilter[]>([]);
  const [sort, setSort] = useState<RowSort | null>(null);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  // Ticked students belong to one view: a new search, filter, sort or page
  // starts with nothing ticked.
  const viewKey = JSON.stringify([search, filters, sort, page]);
  const [selection, setSelection] = useState({ key: viewKey, ids: new Set<number>() });
  const selected = selection.key === viewKey ? selection.ids : new Set<number>();
  const setSelected = (update: Set<number> | ((prev: Set<number>) => Set<number>)) =>
    setSelection((prev) => {
      const current = prev.key === viewKey ? prev.ids : new Set<number>();
      return { key: viewKey, ids: typeof update === "function" ? update(current) : update };
    });

  // Search waits for the teacher to stop typing.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const listQuery = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(filters.length ? { filters } : {}),
      ...(sort ? { sort } : {}),
    }),
    [search, filters, sort],
  );
  const { data, isLoading, isFetching, error } = useTableRows(groupId, {
    ...listQuery,
    page,
    pageSize: ROWS_PAGE_SIZE,
  });

  const table = data?.table;
  const rows = useMemo(() => data?.rows.items ?? [], [data]);
  const total = data?.rows.total ?? 0;
  const columns = useMemo(() => table?.columns ?? [], [table]);

  const allFields: GridField[] = useMemo(
    () => [...CORE_FIELDS.map(coreField), ...columns.map(columnField)],
    [columns],
  );
  const visibleFields = allFields.filter((f) => f.id === "name" || !view.hidden.includes(f.id));

  // --- Mutations ---
  const updateRow = useUpdateRow(groupId);
  const deleteRows = useDeleteRows(groupId);
  const restoreRows = useRestoreRows(groupId);
  const clearColumn = useClearColumn(groupId);
  const deleteColumn = useDeleteColumn(groupId);
  const restoreColumn = useRestoreColumn(groupId);
  const reorder = useReorderColumns(groupId);
  const rename = useRenameTable(groupId);
  const deleteTable = useDeleteTable();
  const restoreTable = useRestoreTable();
  const exportTable = useExportTable(groupId);
  const { data: templates = [] } = useReportTemplates();
  const canReport = templates.length > 0;

  const saveCell = (row: TrackingRow, field: GridField, value: CellValue) => {
    const body = rowBody(row);
    if (field.kind === "column") body.values = { [field.id]: value };
    else if (field.id === "name") body.fullName = String(value ?? "");
    else body[field.id] = value === null ? null : String(value);
    updateRow.mutate({ row, body });
  };

  const removeRows = (rowIds: number[]) =>
    deleteRows.mutate(rowIds, {
      onSuccess: () => {
        setSelected(new Set());
        toast.success(rowIds.length === 1 ? "تم حذف الطالب" : `تم حذف ${formatNumber(rowIds.length)} طلاب`, {
          action: { label: "تراجع", onClick: () => restoreRows.mutate(rowIds) },
        });
      },
    });

  const removeColumn = (column: TrackingColumn) =>
    setDialog({
      kind: "confirm",
      title: `حذف عمود "${column.name}"؟`,
      message: "يختفي العمود وقيمه من الجدول. يمكنك التراجع مباشرة بعد الحذف.",
      confirmLabel: "حذف العمود",
      onConfirm: () =>
        deleteColumn.mutate(column.id, {
          onSuccess: () => {
            setFilters((prev) => prev.filter((f) => f.field !== column.id));
            setSort((prev) => (prev?.field === column.id ? null : prev));
            toast.success(`تم حذف "${column.name}"`, {
              action: { label: "تراجع", onClick: () => restoreColumn.mutate(column.id) },
            });
          },
        }),
    });

  const moveColumn = (draggedId: string, targetId: string) => {
    const ids = columns.map((c) => c.id).filter((id) => id !== draggedId);
    const at = ids.indexOf(targetId);
    if (at < 0) return;
    // Dropping on a column further along puts the dragged one after it.
    const from = columns.findIndex((c) => c.id === draggedId);
    const to = columns.findIndex((c) => c.id === targetId);
    ids.splice(from < to ? at + 1 : at, 0, draggedId);
    reorder.mutate(ids);
  };

  const exportExcel = () =>
    exportTable.mutate(listQuery, {
      onSuccess: (blob) => downloadBlob(blob, `${safeFileName(table?.groupName ?? "table")}.xlsx`),
    });

  const removeTable = () =>
    setDialog({
      kind: "confirm",
      title: "حذف الجدول؟",
      message: "سيُنقل الجدول وكل طلابه إلى المحذوفات، ولا يضيع شيء.",
      confirmLabel: "حذف الجدول",
      onConfirm: () =>
        deleteTable.mutate(groupId, {
          onSuccess: () => {
            toast.success(`تم حذف "${table?.groupName ?? ""}"`, {
              action: { label: "تراجع", onClick: () => restoreTable.mutate(groupId) },
            });
            router.push("/tracking-tables");
          },
        }),
    });

  const toggleRow = (rowId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => (rows.every((r) => prev.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id))));

  const pageCount = Math.max(1, Math.ceil(total / ROWS_PAGE_SIZE));
  const filtered = !!search || filters.length > 0;
  const fieldById = (id: string) => allFields.find((f) => f.id === id);

  if (error && !data) {
    const missing = getApiErrorStatus(error) === 404;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {missing ? "الجدول غير موجود" : "تعذر تحميل الجدول"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {missing ? "ربما حُذف أو الرابط غير صحيح." : "تحقق من اتصالك ثم أعد المحاولة."}
        </p>
        <Link href="/tracking-tables" className={cn(primaryButton, "mt-6")}>
          كل الجداول
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      {/* Header */}
      <Link
        href="/tracking-tables"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ChevronRight size={16} /> جداول المتابعة
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-lg",
            color.gradient,
          )}
        >
          {table ? tableInitial(table.groupName) : ""}
        </span>
        <div className="min-w-0 flex-1">
          {table ? (
            <button
              type="button"
              onClick={() => setDialog({ kind: "rename" })}
              className="group flex max-w-full items-center gap-2 text-start"
            >
              <h1 className="truncate text-2xl font-bold text-zinc-900 dark:text-zinc-100">{table.groupName}</h1>
              <Pencil size={16} className="shrink-0 text-zinc-400 opacity-0 transition group-hover:opacity-100" />
            </button>
          ) : (
            <Skeleton className="h-8 w-56" />
          )}
          <p className="mt-0.5 text-sm text-zinc-500">
            {formatNumber(total)} طالب · {formatNumber(columns.length)} عمود
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canReport && (
            <button
              type="button"
              onClick={() => setDialog({ kind: "report", rowIds: null })}
              disabled={total === 0}
              className={cn(primaryButton, "bg-emerald-600 hover:bg-emerald-700")}
            >
              <Send size={17} /> إرسال تقرير
            </button>
          )}
          <button type="button" onClick={exportExcel} disabled={exportTable.isPending || total === 0} className={secondaryButton}>
            {exportTable.isPending ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
            <span className="hidden sm:inline">تصدير Excel</span>
          </button>
          <AppearancePopover groupId={groupId} fields={allFields} />
          <button type="button" onClick={() => setDialog({ kind: "column" })} className={secondaryButton}>
            <Plus size={17} /> <span className="hidden sm:inline">عمود</span>
          </button>
          <Dropdown
            align="end"
            trigger={
              <button type="button" aria-label="المزيد" className={cn(secondaryButton, "px-2.5")}>
                <MoreHorizontal size={18} />
              </button>
            }
            items={[
              { label: "تغيير الاسم", Icon: Pencil, onSelect: () => setDialog({ kind: "rename" }) },
              {
                label: "الاسم والأرقام من عمود",
                Icon: Wand2,
                disabled: columns.length === 0,
                onSelect: () => setDialog({ kind: "coreFields" }),
              },
              { label: "حذف الجدول", Icon: Trash2, danger: true, separatorBefore: true, onSelect: removeTable },
            ]}
          />
        </div>
      </header>

      {/* Search, filters, sort */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم أو أي نص"
            className={cn(inputClass, "py-2 ps-9")}
          />
        </div>

        <FilterPopover
          fields={allFields}
          onAdd={(filter) => {
            setFilters((prev) => [...prev, filter]);
            setPage(1);
          }}
          trigger={
            <button type="button" className={cn(ghostButton, "border border-dashed border-zinc-300 dark:border-zinc-700")}>
              <Filter size={15} /> تصفية
            </button>
          }
        />

        {filters.map((filter, i) => (
          <span
            key={i}
            className={cn("inline-flex items-center gap-1 rounded-full py-1 pe-1 ps-3 text-xs font-semibold", color.soft, color.text)}
          >
            {describeFilter(filter, fieldById(filter.field))}
            <button
              type="button"
              aria-label="إزالة التصفية"
              onClick={() => {
                setFilters((prev) => prev.filter((_, j) => j !== i));
                setPage(1);
              }}
              className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X size={13} />
            </button>
          </span>
        ))}

        {sort && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 py-1 pe-1 ps-3 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {sort.desc ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
            {fieldById(sort.field)?.label ?? sort.field}
            <button type="button" aria-label="إلغاء الترتيب" onClick={() => setSort(null)} className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10">
              <X size={13} />
            </button>
          </span>
        )}

        {(filters.length > 1 || (filters.length > 0 && !!sort)) && (
          <button
            type="button"
            onClick={() => {
              setFilters([]);
              setSort(null);
              setPage(1);
            }}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            مسح الكل
          </button>
        )}

        {isFetching && !isLoading && <Loader2 size={16} className="ms-auto animate-spin text-zinc-400" />}
      </div>

      {/* The grid */}
      <div className="mt-4">
        <Grid
          groupId={groupId}
          fields={visibleFields}
          rows={rows}
          total={total}
          view={view}
          sort={sort}
          loading={isLoading}
          filtered={filtered}
          selected={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onSort={(next) => {
            setSort(next);
            setPage(1);
          }}
          onAddColumn={() => setDialog({ kind: "column" })}
          onEditColumn={(column) => setDialog({ kind: "column", column })}
          onDeleteColumn={removeColumn}
          onHideField={(id) => toggleHidden(groupId, id)}
          onReorder={moveColumn}
          onSaveCell={saveCell}
          onToggleMessages={(row) =>
            updateRow.mutate({ row, body: { ...rowBody(row), noParentMessages: !row.noParentMessages } })
          }
          onDeleteRow={(row) => removeRows([row.id])}
        />
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={ghostButton}>
            <ChevronRight size={16} /> السابق
          </button>
          <span className="tabular-nums">
            {formatNumber((page - 1) * ROWS_PAGE_SIZE + 1)}–{formatNumber(Math.min(page * ROWS_PAGE_SIZE, total))} من{" "}
            {formatNumber(total)}
          </span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount} className={ghostButton}>
            التالي <ChevronLeft size={16} />
          </button>
        </div>
      )}

      <BulkBar
        count={selected.size}
        columns={columns}
        canReport={canReport}
        onReport={() => setDialog({ kind: "report", rowIds: [...selected] })}
        onDelete={() => removeRows([...selected])}
        onCancel={() => setSelected(new Set())}
        onClearColumn={(column) => {
          const targets = rows.filter((r) => selected.has(r.id));
          setDialog({
            kind: "confirm",
            title: `مسح "${column.name}"؟`,
            message: `ستُمسح قيمة هذا العمود عند ${formatNumber(targets.length)} طالب.`,
            confirmLabel: "مسح",
            onConfirm: () =>
              clearColumn.mutate(
                { rows: targets, columnId: column.id },
                { onSuccess: () => toast.success(`تم مسح "${column.name}"`) },
              ),
          });
        }}
      />

      {/* Dialogs */}
      {dialog?.kind === "column" && (
        <ColumnDialog groupId={groupId} column={dialog.column} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "report" && (
        <ReportDialog groupId={groupId} columns={columns} rowIds={dialog.rowIds} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "rename" && table && (
        <RenameTableDialog
          initialName={table.groupName}
          isPending={rename.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(name) => rename.mutate(name, { onSuccess: () => setDialog(null) })}
        />
      )}
      {dialog?.kind === "coreFields" && (
        <CoreFieldsDialog groupId={groupId} columns={columns} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "confirm" && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel="إلغاء"
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            dialog.onConfirm();
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
