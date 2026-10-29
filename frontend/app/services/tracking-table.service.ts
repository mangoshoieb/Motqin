import axiosInstance from "../lib/axios";
import { TRACKING_TABLE_ROUTES as R } from "../constants/tracking-table.constants";
import {
  CoreField,
  ImportOptions,
  ImportPreview,
  ImportResult,
  ReportBatch,
  ReportPreview,
  ReportTemplate,
  RowQuery,
  RowQueryResult,
  RowWarning,
  SaveColumnBody,
  SaveRowBody,
  TrackingTableHeader,
  TrackingTableSummary,
  TrackingRow,
} from "../types/tracking-table.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// The guide documents bare bodies; other controllers wrap theirs in
// { success, data } — accept either.
const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === "object" && "data" in body && "success" in body
    ? (body as ApiEnvelope<T>).data
    : (body as T);

const get = async <T>(url: string, params?: object) =>
  unwrap<T>((await axiosInstance.get<ApiEnvelope<T> | T>(url, { params })).data);

const post = async <T>(url: string, body?: unknown) =>
  unwrap<T>((await axiosInstance.post<ApiEnvelope<T> | T>(url, body)).data);

const put = async <T>(url: string, body?: unknown) =>
  unwrap<T>((await axiosInstance.put<ApiEnvelope<T> | T>(url, body)).data);

const del = async (url: string) => {
  await axiosInstance.delete(url);
};

// Let the browser set the multipart boundary.
const multipart = { headers: { "Content-Type": undefined } };

export const trackingTableService = {
  // --- Tables ---
  listTables: async (deleted = false) => {
    const tables = await get<TrackingTableSummary[]>(R.TABLES, { deleted });
    return Array.isArray(tables) ? tables : [];
  },
  createTable: (groupName: string) => post<TrackingTableHeader>(R.TABLES, { groupName }),
  getTable: (groupId: string) => get<TrackingTableHeader>(R.TABLE(groupId)),
  renameTable: (groupId: string, groupName: string) =>
    put<TrackingTableHeader>(R.TABLE(groupId), { groupName }),
  deleteTable: (groupId: string) => del(R.TABLE(groupId)),
  restoreTable: (groupId: string) => post<unknown>(R.RESTORE_TABLE(groupId)),

  // --- Columns ---
  addColumn: (groupId: string, body: SaveColumnBody) =>
    post<TrackingTableHeader>(R.COLUMNS(groupId), body),
  updateColumn: (groupId: string, columnId: string, body: SaveColumnBody) =>
    put<TrackingTableHeader>(R.COLUMN(groupId, columnId), body),
  deleteColumn: (groupId: string, columnId: string) => del(R.COLUMN(groupId, columnId)),
  restoreColumn: (groupId: string, columnId: string) =>
    post<unknown>(R.RESTORE_COLUMN(groupId, columnId)),
  reorderColumns: (groupId: string, columnIds: string[]) =>
    put<unknown>(R.COLUMN_ORDER(groupId), { columnIds }),

  // --- Rows ---
  queryRows: (groupId: string, query: RowQuery) =>
    post<RowQueryResult>(R.QUERY_ROWS(groupId), query),
  addRow: (groupId: string, body: SaveRowBody) => post<TrackingRow>(R.ROWS(groupId), body),
  updateRow: (groupId: string, rowId: number, body: SaveRowBody) =>
    put<TrackingRow>(R.ROW(groupId, rowId), body),
  deleteRow: (groupId: string, rowId: number) => del(R.ROW(groupId, rowId)),
  restoreRow: (groupId: string, rowId: number) => post<unknown>(R.RESTORE_ROW(groupId, rowId)),
  setCoreFields: (groupId: string, body: Partial<Record<CoreField, string | null>>) =>
    put<{ rowsUpdated: number; warnings: RowWarning[] }>(R.CORE_FIELDS(groupId), body),

  // --- Import / export ---
  previewImport: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axiosInstance.post(R.IMPORT_PREVIEW, form, multipart);
    return unwrap<ImportPreview>(data);
  },
  importTable: async (file: File, groupName: string, options?: ImportOptions) => {
    const form = new FormData();
    form.append("file", file);
    form.append("groupName", groupName);
    if (options) form.append("options", JSON.stringify(options));
    const { data } = await axiosInstance.post(R.IMPORT, form, multipart);
    return unwrap<ImportResult>(data);
  },
  // An .xlsx file, not JSON — same search/filters/sort as the grid.
  exportTable: async (groupId: string, query: RowQuery) => {
    const { data } = await axiosInstance.post<Blob>(R.EXPORT(groupId), query, {
      responseType: "blob",
    });
    return data;
  },

  // --- Reports ---
  listTemplates: async () => {
    const templates = await get<ReportTemplate[]>(R.REPORT_TEMPLATES);
    return Array.isArray(templates) ? templates : [];
  },
  prepareReport: (
    groupId: string,
    body: { templateKey: string; blanks: string[]; rowIds: number[] | null },
  ) => post<ReportPreview>(R.PREPARE_REPORT(groupId), body),
  allowReport: (batchId: string) =>
    post<{ batchId: string; queued: number }>(R.ALLOW_REPORT(batchId), { confirmConsent: true }),
  stopReport: (batchId: string) =>
    post<{ batchId: string; sent: number; cancelled: number }>(R.STOP_REPORT(batchId)),
  getReport: (batchId: string) => get<ReportBatch>(R.REPORT(batchId)),
  listReports: async () => {
    const reports = await get<ReportBatch[]>(R.REPORTS);
    return Array.isArray(reports) ? reports : [];
  },
  listPreparedReports: async () => {
    const reports = await get<ReportBatch[]>(R.PREPARED_REPORTS);
    return Array.isArray(reports) ? reports : [];
  },
};
