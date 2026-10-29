// Tracking tables: a teacher's group of students, with the three fixed
// fields (name, student phone, parent phone) and columns the teacher adds.
// Shapes follow the backend's "Tracking Table API" front-end guide; Swagger
// documents the request bodies only.

export type ColumnType = "Text" | "Number" | "Date" | "YesNo" | "Choice" | "Exam";

// The fixed fields, as the query/filter/sort endpoints name them.
export type CoreField = "name" | "studentPhone" | "parentPhone";

// GET /tracking-tables — one card per table.
export interface TrackingTableSummary {
  groupId: string;
  groupName: string;
  rows: number;
  columns: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingColumn {
  id: string;
  name: string;
  type: ColumnType;
  maxScore: number | null;
  options: string[] | null;
  position: number;
}

// GET /tracking-tables/{groupId} — the header row.
export interface TrackingTableHeader {
  groupId: string;
  groupName: string;
  columns: TrackingColumn[];
  deletedColumns: TrackingColumn[];
}

// Exam cells hold a score or "absent"; YesNo a boolean; Date an ISO date.
export type CellValue = string | number | boolean | null;

export interface TrackingRow {
  id: number;
  fullName: string;
  studentPhone: string | null;
  parentPhone: string | null;
  noParentMessages: boolean;
  values: Record<string, CellValue>;
}

export type FilterOp =
  | "eq"
  | "neq"
  | "contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "empty"
  | "notEmpty"
  | "in";

export interface RowFilter {
  field: string; // a CoreField or a column id
  op: FilterOp;
  value?: CellValue | CellValue[];
}

export interface RowSort {
  field: string;
  desc: boolean;
}

export interface RowQuery {
  search?: string;
  filters?: RowFilter[];
  sort?: RowSort | null;
  page?: number;
  pageSize?: number;
  deleted?: boolean;
}

// POST /tracking-tables/{groupId}/rows/query
export interface RowQueryResult {
  table: TrackingTableHeader;
  rows: {
    items: TrackingRow[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface SaveColumnBody {
  name: string;
  type: ColumnType;
  maxScore?: number | null;
  options?: string[] | null;
}

// On update, name and phones are always sent; `values` carries only the
// cells that changed (null clears one).
export interface SaveRowBody {
  fullName: string;
  studentPhone: string | null;
  parentPhone: string | null;
  noParentMessages: boolean;
  values?: Record<string, CellValue>;
}

// POST /tracking-tables/import/preview
export interface ImportPreviewColumn {
  index: number;
  header: string;
  guessedType: ColumnType;
  coreField: CoreField | null;
}

export interface ImportPreview {
  sheetName: string;
  rowCount: number;
  columns: ImportPreviewColumn[];
  sampleRows: string[][];
}

// The optional `options` JSON of POST /tracking-tables/import. A sheet
// column index per fixed field (-1 = none), and type overrides by index.
export interface ImportOptions {
  name?: number;
  studentPhone?: number;
  parentPhone?: number;
  types?: Record<string, ColumnType>;
}

export interface RowWarning {
  row: number;
  message: string;
}

export interface ImportResult {
  groupId: string;
  rows: number;
  columns: number;
  coreFields: Record<CoreField, string | null>;
  warnings: RowWarning[];
}

// --- Reports to parents ----------------------------------------------------

export interface ReportTemplate {
  key: string;
  label: string;
  blanks: number;
  body: string; // "ولي أمر الطالب {{1}}، نتيجة {{2}} ..."
}

export interface ReportPreviewMessage {
  rowId: number;
  student: string;
  phone: string;
  text: string;
}

export type SkipReason = "no_parent_phone" | "no_messages" | "empty_value";

export interface ReportSkippedRow {
  rowId: number;
  student: string;
  reason: SkipReason | string;
  blank?: number;
}

// POST /tracking-tables/{groupId}/prepare-report
export interface ReportPreview {
  batchId: string;
  ready: number;
  skipped: number;
  quota: { needed: number; remaining: number | null; code: string | null };
  messages: ReportPreviewMessage[];
  skippedRows: ReportSkippedRow[];
}

export type ReportMessageStatus =
  | "Draft"
  | "Queued"
  | "Sending"
  | "Sent"
  | "Failed"
  | "Skipped"
  | "Cancelled";

export interface ReportCounts {
  draft?: number;
  queued?: number;
  sending?: number;
  sent?: number;
  failed?: number;
  skipped?: number;
  cancelled?: number;
}

export interface ReportBatchMessage {
  student: string;
  phone: string | null;
  status: ReportMessageStatus;
  error?: string | null;
}

// GET /tracking-tables/reports (list) and /reports/{batchId} (with messages).
export interface ReportBatch {
  batchId: string;
  groupName: string;
  template: string;
  createdAt?: string;
  counts: ReportCounts;
  messages?: ReportBatchMessage[];
}
