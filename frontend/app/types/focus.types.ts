// UI-only for now — there are no endpoints for this yet. Shaped against
// Motqin/Models/DistractionControls.cs, which stores exactly three things:
// BlockedApps (a JSON blob), SupervisorEmail, and IsActive. Everything richer
// below (per-app usage, scheduling windows, enforcement state) has no column
// yet and is flagged where it appears.

export type BlockedAppId =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "snapchat"
  | "twitter"
  | "youtube"
  | "whatsapp"
  | "telegram";

// Usage figures can only ever be *reported up* by a companion app that has the
// OS-level permissions (Android UsageStats / iOS Screen Time). The web app
// displays them; it can never measure them itself.
export interface AppUsage {
  appId: BlockedAppId;
  minutesToday: number;
  openCount: number;
  blocked: boolean; // serialised into DistractionControl.BlockedApps
}

export type BlockingMode = "untilPlanDone" | "scheduledWindows";

export interface BlockingWindow {
  id: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  days: number[]; // 0 = Sunday … 6 = Saturday, matching Date#getDay
}

// The student adds this to bind their own future self — not a parent imposing
// it from outside. "pending" until the mentor confirms by email.
export interface Supervisor {
  email: string;
  addedAt: string;
  status: "pending" | "active";
}

// The honest bit. A browser tab cannot block a native app, so the UI must
// always be able to say which of these three states it's actually in rather
// than implying a block it can't deliver.
//   noDevice    — nothing linked; the policy is saved but nothing enforces it
//   deviceIdle  — a companion app is linked but not currently blocking
//   enforcing   — a linked device is actively blocking right now
export type EnforcementState = "noDevice" | "deviceIdle" | "enforcing";

export interface DistractionControls {
  isActive: boolean; // DistractionControl.IsActive
  mode: BlockingMode; // no column yet
  apps: AppUsage[]; // DistractionControl.BlockedApps
  windows: BlockingWindow[]; // no table yet
  supervisor: Supervisor | null; // DistractionControl.SupervisorEmail
  enforcement: EnforcementState; // derived from the companion app, no column yet
  lastSyncedAt: string | null;
}

// ---------------------------------------------------------------------------
// Focus session — the part that genuinely runs in the browser. No device, no
// companion app, no backend: a timer plus the Page Visibility API, which is
// the one distraction signal a web page can legitimately measure about itself.
// ---------------------------------------------------------------------------

export type FocusSessionStatus = "idle" | "running" | "paused" | "completed";

export interface FocusSessionSummary {
  durationMinutes: number;
  focusedSeconds: number;
  leaveCount: number; // times the tab was hidden mid-session
}
