import { MentorPrivilegeName, MentorPrivileges } from "../types/mentorship.types";

const BASE = "/mentorship";

export const MENTORSHIP_ROUTES = {
  // Student side
  REQUESTS: `${BASE}/requests`,
  MY_MENTORS: `${BASE}/my-mentors`,
  PRIVILEGES: (id: number) => `${BASE}/${id}/privileges`,
  END: (id: number) => `${BASE}/${id}/end`,

  // Mentor side
  INCOMING: `${BASE}/requests/incoming`,
  ACCEPT: (id: number) => `${BASE}/${id}/accept`,
  DECLINE: (id: number) => `${BASE}/${id}/decline`,
  MENTEES: `${BASE}/mentees`,
  MENTEE: (id: number) => `${BASE}/mentees/${id}`,
  APPROVE_CHANGE: (id: number) => `${BASE}/${id}/approve-change`,
  REJECT_CHANGE: (id: number) => `${BASE}/${id}/reject-change`,
  UNLINK: (id: number) => `${BASE}/${id}/unlink-mentorship`,
};

// Waiting requests count towards it.
export const MAX_MENTORS = 10;

export const MENTOR_PRIVILEGES: {
  key: keyof MentorPrivileges;
  name: MentorPrivilegeName;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    key: "canViewPerformance",
    name: "ViewPerformance",
    label: "رؤية أدائي",
    short: "الأداء",
    description: "إنجازك اليوم وآخر 7 أيام: الخطط والجلسات ودقائق المذاكرة.",
  },
  {
    key: "canViewBlocker",
    name: "ViewBlocker",
    label: "رؤية إعدادات الحجب",
    short: "الحجب",
    description: "إعدادات منع المشتتات وجداول الحجب، دون أن يغيّرها.",
  },
  {
    key: "canLockBlocker",
    name: "LockBlocker",
    label: "قفل الحجب",
    short: "القفل",
    description:
      "تغيير إعدادات الحجب أو تعديل جداوله وحذفها يحتاج رمزًا من هذا المشرف. مشرف واحد فقط يحمله، ويشمل رؤية الحجب.",
  },
];

export const PRIVILEGE_LABEL: Record<MentorPrivilegeName, string> = Object.fromEntries(
  MENTOR_PRIVILEGES.map((privilege) => [privilege.name, privilege.label]),
) as Record<MentorPrivilegeName, string>;
