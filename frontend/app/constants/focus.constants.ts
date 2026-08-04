import { IconType } from "react-icons";
import {
  FaFacebook,
  FaInstagram,
  FaSnapchat,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { BlockedAppId, BlockingMode, EnforcementState } from "../types/focus.types";

// Expected paths — no DistractionControlsController exists yet, so nothing
// calls these. Written down so wiring them later is a one-file change.
export const FOCUS_API_ROUTES = {
  CONTROLS: "/distraction-controls",
  TOGGLE_APP: "/distraction-controls/apps",
  SUPERVISOR: "/distraction-controls/supervisor",
  SESSIONS: "/focus-sessions",
};

// The fixed catalogue of blockable apps. Brand colours carry the recognition
// here — at a glance a student should spot "تيك توك" by its icon, not by
// reading eight labels. `darkColor` exists because TikTok's and X's brand
// black disappears entirely against a dark background.
export const APP_CATALOG: {
  id: BlockedAppId;
  name: string;
  Icon: IconType;
  color: string;
  darkColor?: string;
}[] = [
  { id: "facebook", name: "فيسبوك", Icon: FaFacebook, color: "#1877F2" },
  { id: "instagram", name: "إنستغرام", Icon: FaInstagram, color: "#E4405F" },
  { id: "tiktok", name: "تيك توك", Icon: FaTiktok, color: "#111111", darkColor: "#F1F1F1" },
  { id: "snapchat", name: "سناب شات", Icon: FaSnapchat, color: "#E5B800" },
  { id: "twitter", name: "إكس (تويتر)", Icon: FaXTwitter, color: "#111111", darkColor: "#F1F1F1" },
  { id: "youtube", name: "يوتيوب", Icon: FaYoutube, color: "#FF0000" },
  { id: "whatsapp", name: "واتساب", Icon: FaWhatsapp, color: "#25D366" },
  { id: "telegram", name: "تلغرام", Icon: FaTelegram, color: "#26A5E4" },
];

export const APP_BY_ID = Object.fromEntries(
  APP_CATALOG.map((app) => [app.id, app])
) as Record<BlockedAppId, (typeof APP_CATALOG)[number]>;

export const BLOCKING_MODE_META: Record<
  BlockingMode,
  { label: string; description: string }
> = {
  untilPlanDone: {
    label: "حجب حتى انتهاء خطتي الدراسية",
    description: "يُرفع الحجب تلقائيًا بمجرد إنهاء كل مهام اليوم في مخططك",
  },
  scheduledWindows: {
    label: "حجب في أوقات محددة في اليوم",
    description: "حدد فترات ثابتة يتكرر فيها الحجب كل أسبوع",
  },
};

// Copy for the enforcement banner. The `noDevice` wording is deliberately
// plain: the student needs to understand that saving a policy here does not
// yet stop anything on their phone. Overstating it once costs the feature all
// its credibility the first time TikTok opens anyway.
export const ENFORCEMENT_META: Record<
  EnforcementState,
  { label: string; detail: string; tone: "neutral" | "warning" | "active" }
> = {
  noDevice: {
    label: "لا يوجد جهاز مرتبط",
    detail:
      "إعداداتك محفوظة، لكن الحجب الفعلي يحتاج تطبيق متقن على هاتفك — المتصفح لا يملك صلاحية إيقاف تطبيقات الهاتف. اربط جهازك ليبدأ التنفيذ.",
    tone: "warning",
  },
  deviceIdle: {
    label: "الجهاز مرتبط — الحجب متوقف",
    detail: "جهازك جاهز للتنفيذ، لكن لا توجد فترة حجب نشطة في الوقت الحالي.",
    tone: "neutral",
  },
  enforcing: {
    label: "الحجب نشط الآن",
    detail: "التطبيقات المحددة محجوبة على جهازك المرتبط.",
    tone: "active",
  },
};

export const WEEK_DAY_LABELS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

// Session lengths offered up front. 25 is a pomodoro, 50 a double, 90 a full
// ultradian block — the three lengths students actually reach for.
export const FOCUS_DURATIONS = [25, 50, 90];

// "8 دقائق" / "45 دقيقة" / "1س 15د" — kept short enough to sit inside an app
// card. Arabic changes the noun by count: 1 دقيقة, 2 دقيقتان, 3–10 دقائق,
// 11+ back to دقيقة, so "10 دقيقة" reads as plainly wrong to a native eye.
export const formatUsage = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}س` : `${hours}س ${rest}د`;
  }

  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
};

// mm:ss, or h:mm:ss once the session passes an hour.
export const formatCountdown = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

// Arabic agreement for "مرة" — 1 مرة, 2 مرتان, 3-10 مرات, 11+ مرة.
export const formatTimes = (count: number) => {
  if (count === 1) return "مرة واحدة";
  if (count === 2) return "مرتان";
  if (count <= 10) return `${count} مرات`;
  return `${count} مرة`;
};
