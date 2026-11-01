import { IconType } from "react-icons";
import {
  FaChrome,
  FaDiscord,
  FaFacebook,
  FaFacebookMessenger,
  FaInstagram,
  FaMapLocationDot,
  FaSnapchat,
  FaSpotify,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { LookupItem } from "../types/lookup.types";

const BASE = "/distraction-blocker";

export const BLOCKER_ROUTES = {
  SETTINGS: `${BASE}/settings`,
  SCHEDULES: `${BASE}/schedules`,
  SCHEDULE: (id: number) => `${BASE}/schedules/${id}`,
  // A code shows on the lock-holding mentor's page for 10 minutes; entering
  // it opens the locked settings for 15.
  UNLOCK_REQUEST: "/mentorship/blocker-unlock/request",
  UNLOCK_VERIFY: "/mentorship/blocker-unlock/verify",
};

export const BLOCKER_LIMITS = {
  APPS: 200,
  WEBSITES: 200,
  ENTRY_LENGTH: 255,
};

// GET /lookups/week-days as it ships — used until the lookup arrives, or if
// it fails, so the day picker never waits on it.
export const WEEK_DAYS_FALLBACK: LookupItem[] = [
  { value: 6, key: "Saturday", nameAr: "السبت", nameEn: "Saturday" },
  { value: 0, key: "Sunday", nameAr: "الأحد", nameEn: "Sunday" },
  { value: 1, key: "Monday", nameAr: "الاثنين", nameEn: "Monday" },
  { value: 2, key: "Tuesday", nameAr: "الثلاثاء", nameEn: "Tuesday" },
  { value: 3, key: "Wednesday", nameAr: "الأربعاء", nameEn: "Wednesday" },
  { value: 4, key: "Thursday", nameAr: "الخميس", nameEn: "Thursday" },
  { value: 5, key: "Friday", nameAr: "الجمعة", nameEn: "Friday" },
];

// Friendly names for the package ids students allow most. The phone sends
// raw ids; anything not listed here shows its id as-is. `darkColor` exists
// because TikTok's and X's brand black disappears on a dark background.
export const KNOWN_APPS: Record<
  string,
  { name: string; Icon: IconType; color: string; darkColor?: string }
> = {
  "com.whatsapp": { name: "واتساب", Icon: FaWhatsapp, color: "#25D366" },
  "com.whatsapp.w4b": { name: "واتساب للأعمال", Icon: FaWhatsapp, color: "#25D366" },
  "org.telegram.messenger": { name: "تلغرام", Icon: FaTelegram, color: "#26A5E4" },
  "com.facebook.katana": { name: "فيسبوك", Icon: FaFacebook, color: "#1877F2" },
  "com.facebook.orca": { name: "ماسنجر", Icon: FaFacebookMessenger, color: "#0084FF" },
  "com.instagram.android": { name: "إنستغرام", Icon: FaInstagram, color: "#E4405F" },
  "com.zhiliaoapp.musically": {
    name: "تيك توك",
    Icon: FaTiktok,
    color: "#111111",
    darkColor: "#F1F1F1",
  },
  "com.snapchat.android": { name: "سناب شات", Icon: FaSnapchat, color: "#E5B800" },
  "com.twitter.android": {
    name: "إكس (تويتر)",
    Icon: FaXTwitter,
    color: "#111111",
    darkColor: "#F1F1F1",
  },
  "com.google.android.youtube": { name: "يوتيوب", Icon: FaYoutube, color: "#FF0000" },
  "com.google.android.apps.maps": {
    name: "خرائط جوجل",
    Icon: FaMapLocationDot,
    color: "#34A853",
  },
  "com.android.chrome": { name: "كروم", Icon: FaChrome, color: "#4285F4" },
  "com.discord": { name: "ديسكورد", Icon: FaDiscord, color: "#5865F2" },
  "com.spotify.music": { name: "سبوتيفاي", Icon: FaSpotify, color: "#1DB954" },
};
