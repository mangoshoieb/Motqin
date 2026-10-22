import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GuestRemaining } from "../types/auth.types";

// How many free uses the guest has left. Seeded by POST /auth/guest and kept
// current from the X-Guest-Remaining-* response headers (see lib/axios.ts).
// Persisted so a reload still knows the last counts.

interface GuestState {
  remaining: GuestRemaining | null;
  setRemaining: (remaining: GuestRemaining) => void;
  patchRemaining: (patch: Partial<GuestRemaining>) => void;
  clear: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      remaining: null,
      setRemaining: (remaining) => set({ remaining }),
      patchRemaining: (patch) =>
        set((state) => ({
          remaining: {
            studySessions: state.remaining?.studySessions ?? 3,
            spacedRepetitionSessions: state.remaining?.spacedRepetitionSessions ?? 3,
            ...patch,
          },
        })),
      clear: () => set({ remaining: null }),
    }),
    { name: "motqin:guest" },
  ),
);

export const GUEST_FREE_USES = 3;

/** Arabic name for the backend's feature key on guest_limit_reached. */
export const guestFeatureLabel = (feature?: string) => {
  const key = (feature ?? "").toLowerCase();
  if (key.includes("spaced")) return "جلسات المراجعة المتباعدة";
  if (key.includes("study")) return "جلسات المذاكرة";
  return null;
};
