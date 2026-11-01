// Focus session — the part of the blocker page that runs in the browser. No
// device, no companion app, no backend: a timer plus the Page Visibility API,
// which is the one distraction signal a web page can legitimately measure
// about itself. The real blocker lives in distraction-blocker.types.ts.

export type FocusSessionStatus = "idle" | "running" | "paused" | "completed";

export interface FocusSessionSummary {
  durationMinutes: number;
  focusedSeconds: number;
  leaveCount: number; // times the tab was hidden mid-session
}
