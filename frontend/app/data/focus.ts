import { DistractionControls } from "@/app/types/focus.types";

// Mock — no DistractionControlsController exists yet. Usage figures below are
// the kind a companion app would report up; the web app can never measure them
// itself. Enforcement is deliberately seeded as "noDevice" because that is the
// true state of the product today: a student can build a policy here, but
// nothing is enforcing it until the mobile app ships.
export const distractionControls: DistractionControls = {
  isActive: false,
  mode: "untilPlanDone",
  enforcement: "noDevice",
  lastSyncedAt: null,
  supervisor: null,

  apps: [
    { appId: "facebook", minutesToday: 15, openCount: 2, blocked: false },
    { appId: "instagram", minutesToday: 45, openCount: 11, blocked: true },
    { appId: "tiktok", minutesToday: 82, openCount: 23, blocked: true },
    { appId: "snapchat", minutesToday: 12, openCount: 6, blocked: false },
    { appId: "twitter", minutesToday: 10, openCount: 4, blocked: false },
    { appId: "youtube", minutesToday: 38, openCount: 5, blocked: true },
    { appId: "whatsapp", minutesToday: 27, openCount: 19, blocked: false },
    { appId: "telegram", minutesToday: 8, openCount: 3, blocked: false },
  ],

  windows: [
    { id: "w1", startTime: "16:00", endTime: "19:00", days: [0, 1, 2, 3, 4] },
    { id: "w2", startTime: "20:00", endTime: "22:30", days: [6] },
  ],
};
