import { create } from "zustand";

// The app-wide "you need an account / a subscription" popup. Opened from
// anywhere — including the axios interceptor, outside React — via
// useAuthGate.getState().open(...); AuthGateDialog (mounted once in
// AuthProvider) renders whatever is open.

export type AuthGateKind =
  // First visit with no session: sign in, sign up, or try as a guest.
  | "welcome"
  // 403 registration_required — the feature never works for guests.
  | "registration_required"
  // 403 guest_limit_reached — the 3 free uses of a feature are gone.
  | "guest_limit_reached"
  // A registered user hitting a paid feature.
  | "subscription_required"
  // Nudge to sign up so the guest's work isn't left on a trial account.
  | "save_progress";

export interface AuthGate {
  kind: AuthGateKind;
  // Backend's feature name on guest_limit_reached, e.g. study sessions.
  feature?: string;
  // Backend's own copy, shown when we have nothing better.
  message?: string;
}

interface AuthGateState {
  gate: AuthGate | null;
  open: (gate: AuthGate) => void;
  close: () => void;
}

export const useAuthGate = create<AuthGateState>((set) => ({
  gate: null,
  open: (gate) => set({ gate }),
  close: () => set({ gate: null }),
}));

// Where to send the user back to once they finish signing in/up from the
// popup. sessionStorage rather than a query param so it survives the
// sign-in -> verify-phone -> complete-profile hops untouched.
const RETURN_PATH_KEY = "motqin:authReturnPath";

export const authReturnPath = {
  set: (path: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  },

  /** Reads and forgets the saved path. Only same-site paths are honoured. */
  take: (): string | null => {
    if (typeof window === "undefined") return null;
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    sessionStorage.removeItem(RETURN_PATH_KEY);
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  },
};
