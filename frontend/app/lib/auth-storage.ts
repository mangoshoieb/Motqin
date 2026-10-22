// Fired on every token write/clear in this tab, so hooks that depend on
// "is anyone signed in" re-render without a reload. Other tabs hear the
// browser's own "storage" event instead.
const TOKENS_CHANGED_EVENT = "auth:tokens-changed";

const DEVICE_ID_KEY = "motqin:deviceId";

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const notifyTokensChanged = () => {
  window.dispatchEvent(new Event(TOKENS_CHANGED_EVENT));
};

const decodeTokenPayload = (token: string | null): Record<string, unknown> | null => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const authStorage = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("accessToken");
  },

  getRefreshToken: () => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("refreshToken");
  },

  setTokens: (access: string, refresh: string) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    notifyTokensChanged();
  },

  clear: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    notifyTokensChanged();
  },

  getAccessTokenExpiry: (): number | null => {
    if (typeof window === "undefined") return null;

    const payload = decodeTokenPayload(localStorage.getItem("accessToken"));
    return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
  },

  // Guest sessions (POST /auth/guest) carry the "Guest" role claim;
  // registered accounts never do. Read straight from the token so it's
  // known before GET /users/me comes back.
  isGuest: (): boolean => {
    if (typeof window === "undefined") return false;

    const payload = decodeTokenPayload(localStorage.getItem("accessToken"));
    const roles = payload?.[ROLE_CLAIM] ?? payload?.role;
    return Array.isArray(roles) ? roles.includes("Guest") : roles === "Guest";
  },

  subscribe: (onChange: () => void) => {
    window.addEventListener(TOKENS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
      window.removeEventListener(TOKENS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  },

  // Stable per-install id sent as X-Device-Id when starting a guest trial.
  // Deliberately survives logout: the backend hands the same device the
  // same guest back, so signing out doesn't grant a fresh trial.
  getDeviceId: (): string => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },
};
