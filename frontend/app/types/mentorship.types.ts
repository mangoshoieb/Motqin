// /mentorship/* — shaped against the "Mentors & Sign-in API.html" guide. A
// student invites anyone with an account as a mentor and chooses what that
// mentor may see or do. It isn't a role: every registered user can be a
// student to some people and a mentor to others.

import { BlockerSettings, BlockerUnlockState, BlockSchedule } from "./distraction-blocker.types";

// Pending → Active (accepted) / Declined / Cancelled (student withdrew);
// Active → Ended (either side unlinked).
export type MentorshipStatus = "Pending" | "Active" | "Declined" | "Cancelled" | "Ended";

// The names that show in `removalRequested`. Only "ViewPerformance" appears
// in the guide; the other two are assumed to follow the same pattern.
export type MentorPrivilegeName = "ViewPerformance" | "ViewBlocker" | "LockBlocker";

export interface MentorPrivileges {
  canViewPerformance: boolean; // today and the last 7 days
  canViewBlocker: boolean; // the blocker settings and schedules
  canLockBlocker: boolean; // one mentor at most; turns canViewBlocker on too
}

interface MentorshipLink extends MentorPrivileges {
  id: number;
  status: MentorshipStatus;
  // Privileges the student switched off that still wait for the mentor.
  removalRequested: MentorPrivilegeName[];
  // The student asked to end a link that has privileges; waits too.
  endRequested: boolean;
  createdAt: string;
  respondedAt: string | null;
  // The mentor's plan doesn't cover this student now (Free can't mentor, or
  // more students than the plan's Mentees). Nothing is deleted; renewing
  // brings it back. A paused link has no data, its lock doesn't apply, and
  // the student's changes apply without approval.
  paused?: boolean;
}

// ---- Student side ---------------------------------------------------------

export interface MyMentor extends MentorshipLink {
  mentorName: string;
  mentorPhone: string;
  mentorPhotoUrl: string | null;
}

export interface MyMentorsResponse {
  mentors: MyMentor[]; // newest first, waiting requests included
  blockerLock: BlockerUnlockState;
}

// ---- Mentor side ----------------------------------------------------------

export interface IncomingMentorRequest {
  id: number;
  studentName: string;
  studentPhone: string;
  studentPhotoUrl: string | null;
  createdAt: string;
}

export interface DayPerformance {
  date: string; // "2026-10-27", a UTC calendar day
  completedPlansCount: number;
  completedSessionsCount: number;
  productiveMinutes: number;
}

export interface Mentee extends MentorshipLink {
  studentName: string;
  studentPhotoUrl: string | null;
  today: DayPerformance | null; // only with canViewPerformance
  // Only while the student waits for a code, and only for the lock holder.
  unlockCode: string | null;
  unlockCodeExpiresAt: string | null;
}

export interface WeekPerformance {
  startDate: string;
  endDate: string;
  days: DayPerformance[]; // 7, oldest first
  totalCompletedPlansCount: number;
  totalCompletedSessionsCount: number;
  totalProductiveMinutes: number;
  activeDaysCount: number;
}

export interface MenteeDetail extends Mentee {
  week: WeekPerformance | null; // with canViewPerformance
  blocker: {
    settings: BlockerSettings;
    schedules: BlockSchedule[];
    lock: BlockerUnlockState;
  } | null; // with canViewBlocker
}
