// "يحتاج انتباهك" on the teacher's home page: things about their students
// that the teacher should act on.
// MOCK SHAPE — no endpoint yet; adjust to the real payload once the backend
// sends it.
export type TeacherAlertKind =
  | "grades_drop" // students whose scores fell
  | "missed_exam" // students absent from the last exam
  | "report_pending" // a report prepared but not sent
  | "assistant_request"; // an assistant asking for a permission

export interface TeacherAlert {
  id: string;
  kind: TeacherAlertKind;
  title: string;
  detail?: string;
  // Table the alert is about, when there is one.
  groupId?: string | null;
  groupName?: string | null;
}
