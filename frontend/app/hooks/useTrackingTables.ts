"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { trackingTableService as api } from "@/app/services/tracking-table.service";
import { REPORT_POLL_MS } from "@/app/constants/tracking-table.constants";
import {
  CoreField,
  ImportOptions,
  RowQuery,
  RowQueryResult,
  SaveColumnBody,
  SaveRowBody,
  TrackingRow,
} from "@/app/types/tracking-table.types";
import { toastApiError } from "@/app/lib/api-error";
import { apiErrorCode } from "@/app/lib/tracking-table";

export const TRACKING_KEYS = {
  all: ["tracking-tables"] as const,
  list: ["tracking-tables", "list"] as const,
  table: (groupId: string) => ["tracking-tables", "table", groupId] as const,
  rows: (groupId: string) => ["tracking-tables", "table", groupId, "rows"] as const,
  rowsQuery: (groupId: string, query: RowQuery) =>
    ["tracking-tables", "table", groupId, "rows", query] as const,
  templates: ["tracking-tables", "templates"] as const,
  reports: ["tracking-tables", "reports"] as const,
  report: (batchId: string) => ["tracking-tables", "reports", batchId] as const,
};

// Every cached page of a table's rows, edited in place so a change shows at
// once (the server's answer replaces it a moment later).
const patchRowPages = (
  queryClient: QueryClient,
  groupId: string,
  patch: (data: RowQueryResult) => RowQueryResult,
) =>
  queryClient.setQueriesData<RowQueryResult>({ queryKey: TRACKING_KEYS.rows(groupId) }, (data) =>
    data ? patch(data) : data,
  );

const replaceRow = (data: RowQueryResult, row: TrackingRow): RowQueryResult => ({
  ...data,
  rows: {
    ...data.rows,
    items: data.rows.items.map((item) => (item.id === row.id ? row : item)),
  },
});

// --- Tables ----------------------------------------------------------------

export const useTrackingTables = () =>
  useQuery({ queryKey: TRACKING_KEYS.list, queryFn: () => api.listTables(false) });

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.list }),
    onError: (error) => toastApiError("تعذر إنشاء الجدول", error),
  });
};

export const useRenameTable = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupName: string) => api.renameTable(groupId, groupName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.all }),
    onError: (error) => toastApiError("تعذر تغيير اسم الجدول", error),
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.list }),
    onError: (error) => toastApiError("تعذر حذف الجدول", error),
  });
};

export const useRestoreTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreTable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.list }),
    onError: (error) => toastApiError("تعذر استرجاع الجدول", error),
  });
};

// --- Rows (the grid) ---------------------------------------------------------

// The grid: header row + one page of students. The previous page stays on
// screen while a new search/filter/sort loads.
export const useTableRows = (groupId: string, query: RowQuery) =>
  useQuery({
    queryKey: TRACKING_KEYS.rowsQuery(groupId, query),
    queryFn: () => api.queryRows(groupId, query),
    placeholderData: keepPreviousData,
    enabled: !!groupId,
  });

const useInvalidateTable = (groupId: string) => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.table(groupId) }),
      queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.list }),
    ]);
};

export const useAddRow = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (body: SaveRowBody) => api.addRow(groupId, body),
    onSuccess: invalidate,
    onError: (error) => toastApiError("تعذر إضافة الطالب", error),
  });
};

// A cell edit: shown at once, rolled back if the server refuses it.
export const useUpdateRow = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ row, body }: { row: TrackingRow; body: SaveRowBody }) =>
      api.updateRow(groupId, row.id, body),
    onMutate: async ({ row, body }) => {
      await queryClient.cancelQueries({ queryKey: TRACKING_KEYS.rows(groupId) });
      const snapshot = queryClient.getQueriesData<RowQueryResult>({
        queryKey: TRACKING_KEYS.rows(groupId),
      });
      const { values, ...fields } = body;
      patchRowPages(queryClient, groupId, (data) =>
        replaceRow(data, { ...row, ...fields, values: { ...row.values, ...values } }),
      );
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toastApiError("تعذر حفظ التعديل", error);
      // Someone else changed this student: show their version.
      if (apiErrorCode(error) === "edited_elsewhere") {
        void queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.rows(groupId) });
      }
    },
    onSuccess: (saved) => {
      if (saved && typeof saved === "object" && "id" in saved) {
        patchRowPages(queryClient, groupId, (data) => replaceRow(data, saved));
      }
    },
  });
};

export const useDeleteRows = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (rowIds: number[]) => Promise.all(rowIds.map((id) => api.deleteRow(groupId, id))),
    onSettled: invalidate,
    onError: (error) => toastApiError("تعذر حذف الطالب", error),
  });
};

export const useRestoreRows = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (rowIds: number[]) => Promise.all(rowIds.map((id) => api.restoreRow(groupId, id))),
    onSettled: invalidate,
    onError: (error) => toastApiError("تعذر استرجاع الطالب", error),
  });
};

// Bulk "clear this column" for the ticked students: one PUT per row, with
// only that cell set to null.
export const useClearColumn = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: ({ rows, columnId }: { rows: TrackingRow[]; columnId: string }) =>
      Promise.all(
        rows.map((row) =>
          api.updateRow(groupId, row.id, {
            fullName: row.fullName,
            studentPhone: row.studentPhone,
            parentPhone: row.parentPhone,
            noParentMessages: row.noParentMessages,
            values: { [columnId]: null },
          }),
        ),
      ),
    onSettled: invalidate,
    onError: (error) => toastApiError("تعذر مسح العمود", error),
  });
};

export const useSetCoreFields = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (body: Partial<Record<CoreField, string | null>>) =>
      api.setCoreFields(groupId, body),
    onSuccess: invalidate,
    onError: (error) => toastApiError("تعذر حفظ الأعمدة الأساسية", error),
  });
};

// --- Columns -----------------------------------------------------------------

// Errors are left to the column dialog: values_dont_fit needs its details.
export const useSaveColumn = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: ({ columnId, body }: { columnId?: string; body: SaveColumnBody }) =>
      columnId ? api.updateColumn(groupId, columnId, body) : api.addColumn(groupId, body),
    onSuccess: invalidate,
  });
};

export const useDeleteColumn = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (columnId: string) => api.deleteColumn(groupId, columnId),
    onSuccess: invalidate,
    onError: (error) => toastApiError("تعذر حذف العمود", error),
  });
};

export const useRestoreColumn = (groupId: string) => {
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (columnId: string) => api.restoreColumn(groupId, columnId),
    onSuccess: invalidate,
    onError: (error) => toastApiError("تعذر استرجاع العمود", error),
  });
};

// After a drag: the new order shows at once.
export const useReorderColumns = (groupId: string) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTable(groupId);
  return useMutation({
    mutationFn: (columnIds: string[]) => api.reorderColumns(groupId, columnIds),
    onMutate: (columnIds) => {
      patchRowPages(queryClient, groupId, (data) => {
        const byId = new Map(data.table.columns.map((c) => [c.id, c]));
        const columns = columnIds.flatMap((id) => byId.get(id) ?? []);
        return { ...data, table: { ...data.table, columns } };
      });
    },
    onSettled: invalidate,
    onError: (error) => toastApiError("تعذر ترتيب الأعمدة", error),
  });
};

// --- Import / export -----------------------------------------------------------

// Errors are shown inside the import dialog, next to the file.
export const usePreviewImport = () => useMutation({ mutationFn: api.previewImport });

export const useImportTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, groupName, options }: { file: File; groupName: string; options?: ImportOptions }) =>
      api.importTable(file, groupName, options),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.list }),
  });
};

export const useExportTable = (groupId: string) =>
  useMutation({
    mutationFn: (query: RowQuery) => api.exportTable(groupId, query),
    onError: (error) => toastApiError("تعذر تصدير الجدول", error),
  });

// --- Reports -------------------------------------------------------------------

// An empty list means sending is off for this account.
export const useReportTemplates = () =>
  useQuery({
    queryKey: TRACKING_KEYS.templates,
    queryFn: api.listTemplates,
    staleTime: 5 * 60_000,
  });

export const usePrepareReport = (groupId: string) =>
  useMutation({
    mutationFn: (body: { templateKey: string; blanks: string[]; rowIds: number[] | null }) =>
      api.prepareReport(groupId, body),
  });

export const useAllowReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.allowReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.reports }),
  });
};

export const useStopReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.stopReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRACKING_KEYS.reports }),
    onError: (error) => toastApiError("تعذر إيقاف الإرسال", error),
  });
};

// One report's progress, re-read every few seconds while anything is still
// waiting or going out.
export const useReport = (batchId: string | null) =>
  useQuery({
    queryKey: TRACKING_KEYS.report(batchId ?? ""),
    queryFn: () => api.getReport(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const counts = query.state.data?.counts;
      return counts && (counts.queued ?? 0) + (counts.sending ?? 0) > 0 ? REPORT_POLL_MS : false;
    },
  });

// Sent reports and the ones prepared but never allowed, newest first.
export const useReports = () =>
  useQuery({
    queryKey: TRACKING_KEYS.reports,
    queryFn: async () => {
      const [sent, prepared] = await Promise.all([api.listReports(), api.listPreparedReports()]);
      const seen = new Set(sent.map((r) => r.batchId));
      return [...prepared.filter((r) => !seen.has(r.batchId)), ...sent];
    },
  });
