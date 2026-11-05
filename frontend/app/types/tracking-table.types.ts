// Tracking tables: a teacher's group of students, with the three fixed
// fields (name, student phone, parent phone) and columns the teacher adds.
// Shapes follow the backend's "Tracking Table API" front-end guide; Swagger
// documents the request bodies only.

export type ColumnType = "Text" | "Number" | "Date" | "YesNo" | "Choice" | "Exam";

// The fixed fields, as the query/filter/sort endpoints name them.
export type CoreField = "name" | "studentPhone" | "parentPhone";

// What a teacher can let an assistant do (GET /lookups/assistant-permissions).
// Seeing shared tables, their students and the performance report needs none.
export type AssistantPermission =
  | "CreateTables"
  | "EditTables"
  | "AddRows"
  | "EditRows"
  | "DeleteRows"
  | "DeleteTables"
  | "Import"
  | "Export"
  | "PrepareReports"
  | "SendReports";

export interface AssistantPermissionItem {
  value: number;
  key: AssistantPermission;
  nameAr: string;
  nameEn: string;
}

// GET /tracking-tables — one card per table: the caller's own first, then
// the ones teachers shared with them.
export interface TrackingTableSummary {
  groupId: string;
  groupName: string;
  rows: number;
  columns: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Missing on servers from before assistants; treated as the caller's own.
  isOwner?: boolean;
  teacher?: { userId: string; name: string } | null;
  // All 10 keys on the caller's own tables.
  myPermissions?: AssistantPermission[];
}

// ---- Assistants -------------------------------------------------------------

export interface SharedTableRef {
  groupId: string;
  groupName: string;
}

// GET/POST/PUT /tracking-tables/assistants — the teacher's side. `id` is the
// link's id. `tables` is empty when allTables is true.
export interface TrackingAssistant {
  id: number;
  userId: string;
  name: string;
  phoneNumber: string;
  permissions: AssistantPermission[];
  allTables: boolean;
  tables: SharedTableRef[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveAssistantBody {
  permissions: AssistantPermission[];
  allTables: boolean;
  groupIds?: string[];
}

// GET /tracking-tables/assisting — the assistant's side. teacherId is what
// goes out as forTeacherId when creating or importing for that teacher.
export interface AssistingLink {
  id: number;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  permissions: AssistantPermission[];
  allTables: boolean;
  tables: SharedTableRef[];
  createdAt: string;
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

// What POST /tracking-tables/import takes besides the file and name. A sheet
// column index per fixed field (-1 = none) — sent only for fields the user
// changed from the preview, so the server keeps the column it recognised —
// type overrides by index, and (assistants) the teacher it's for.
export interface ImportOptions {
  name?: number;
  studentPhone?: number;
  parentPhone?: number;
  types?: Record<string, ColumnType>;
  forTeacherId?: string;
}

export interface RowWarning {
  row: number;
  message: string;
}

export interface ImportResult {
  groupId: string;
  rows: number;
  columns: number;
  // The sheet header that filled each fixed field, or null. (Older servers
  // sent a column id here.)
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

// --- Performance report ------------------------------------------------------
// POST /tracking-tables/{groupId}/performance. Everything is a percent of the
// full mark, already rounded to 1 decimal. Absent and empty cells count in no
// average; any value can be null (show "—").

export type Standing = "above" | "average" | "below";

export type PerformanceFlag =
  | "fell_from_full_mark"
  | "dropped_below_average"
  | "rose_above_average"
  | "big_drop"
  | "improving"
  | "declining"
  | "always_below"
  | "inconsistent"
  | "often_absent"
  | "missing_scores";

// 0-49, 50-64, 65-74, 75-84, 85-100, in that order.
export interface DistributionBin {
  range: string;
  count: number;
}

// The class on one exam, or (overall) on each student's average.
export interface ClassStats {
  counted: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  variance: number | null;
  stdDev: number | null;
  averageFrom: number | null; // the "average" band
  averageTo: number | null;
  above: number;
  average: number;
  below: number;
  distribution: DistributionBin[];
}

export interface ExamStats extends ClassStats {
  columnId: string;
  name: string;
  maxScore: number;
  absent: number;
  missing: number;
  meanScore: number | null; // the mean in marks
  fullMarks: number;
  passRate: number | null; // % of those who sat it scoring 50%+
}

export interface StudentExamScore {
  columnId: string;
  score: number | null;
  percent: number | null;
  absent: boolean;
  rank: number | null;
  standing: Standing | null;
  zScore: number | null;
}

export interface StudentPerformance {
  rowId: number;
  name: string;
  scores: StudentExamScore[]; // in the order the exams were sent
  taken: number;
  absent: number;
  missing: number;
  average: number | null; // null when absent from every chosen exam
  rank: number | null;
  standing: Standing | null;
  stdDev: number | null;
  trend: number | null; // points per exam
  change: number | null; // last exam taken minus first
  rankChange: number | null; // positive = moved up
  flags: PerformanceFlag[];
}

export interface PerformanceHighlight {
  rowId?: number;
  columnId?: string;
  name: string;
  value: number;
}

export interface PerformanceHighlights {
  top: PerformanceHighlight[];
  needsFollowUp: PerformanceHighlight[]; // lowest first
  mostImproved: PerformanceHighlight | null;
  mostDeclined: PerformanceHighlight | null;
  hardestExam: PerformanceHighlight | null; // null with one exam or equal means
  easiestExam: PerformanceHighlight | null;
  mostConsistent: PerformanceHighlight | null;
  leastConsistent: PerformanceHighlight | null;
}

export interface PerformanceReport {
  groupId: string;
  groupName: string;
  averageBand: number;
  exams: ExamStats[];
  overall: ClassStats | null;
  students: StudentPerformance[];
  highlights: PerformanceHighlights;
}

// GET /lookups/performance-flags
export interface PerformanceFlagsLookup {
  standings: { key: Standing; nameAr: string; nameEn: string }[];
  flags: { key: PerformanceFlag; nameAr: string; nameEn: string }[];
}
