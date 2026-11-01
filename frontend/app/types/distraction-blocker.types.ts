// /distraction-blocker/* and /mentorship/blocker-unlock/* — shaped against
// the "Distraction Blocker API.html" guide. The blocking itself runs on the
// phone; the web only edits what the phone reads (settings, schedules) and
// asks the mentor for an unlock code. The block log (sessions/start, end,
// active) is the phone's business and isn't used here.

export interface BlockerSettings {
  // Block for the whole study session, even outside every schedule.
  blockDuringStudySessions: boolean;
  // With the above on, lift the block during the session's break.
  unblockDuringBreaks: boolean;
  // The phone starts the day's "until the plan is done" block at midnight.
  autoStartPlanBlock: boolean;
  // Android package ids that stay usable; every other app is blocked.
  allowedApps: string[];
  // Hosts, e.g. "youtube.com" — the server strips links down to this.
  blockedWebsites: string[];
  // The mentor lock. Read-only; ignored if sent back.
  lockedByMentor: boolean;
  unlockedUntil: string | null; // UTC, sometimes without the "Z"
}

export type BlockerSettingsInput = Omit<BlockerSettings, "lockedByMentor" | "unlockedUntil">;

export interface BlockSchedule {
  id: number;
  days: number[]; // 0 = Sunday … 6 = Saturday, sorted
  // true: blocks all day and lifts once today's plan is done (no times).
  blockUntilPlanCompleted: boolean;
  startTime: string | null; // "17:00:00", the phone's local time
  endTime: string | null; // before startTime = crosses midnight
  isEnabled: boolean;
  createdAt: string;
}

export interface BlockScheduleInput {
  days: number[];
  blockUntilPlanCompleted: boolean;
  startTime?: string; // "HH:mm"; left out for a plan schedule
  endTime?: string;
  isEnabled: boolean;
}

// POST /mentorship/blocker-unlock/request and /verify.
export interface BlockerUnlockState {
  locked: boolean;
  unlockedUntil: string | null;
  codeExpiresAt: string | null;
}

// The coded errors. Everything else is { success: false, message } with an
// English sentence in `message`.
export type BlockerErrorCode =
  | "blocker_locked"
  | "block_running"
  | "blocker_not_locked"
  | "cooldown"
  | "unlock_code_invalid"
  | "unlock_code_expired"
  | "validation_error";

export interface BlockerErrorBody {
  code: BlockerErrorCode | string;
  message: string;
  details?: {
    blockId?: number;
    endsAt?: string | null; // block_running: planned end, null for a plan block
    retryAfterSeconds?: number; // cooldown
    attemptsLeft?: number; // unlock_code_invalid
  };
}
