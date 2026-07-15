import axios from "axios";
import { toast } from "sonner";
import { authStorage } from "./auth-storage";
import { getApiErrorMessage, getApiErrorStatus } from "./api-error";

// Catch-all toast for every failed API call — 400/401/403/500/network/etc.
// Shows whatever message the backend sent back (or a generic Arabic
// fallback per status code) so we can see real backend messages during
// development. Tune per-endpoint later by handling specific errors in a
// mutation's onError before it reaches here, or by checking status/message
// here and special-casing it.
const showApiErrorToast = (error: unknown) => {
  if (typeof window === "undefined" || axios.isCancel(error)) return;

  const status = getApiErrorStatus(error);
  const message = getApiErrorMessage(error);

  // toast.error(message, {
  //   description: status ? `Status: ${status}` : undefined, className: "!bg-red-200/80  !max-w-[500px]",
  // });
  console.log(error)
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const axiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const logoutLocal = () => {
  authStorage.clear();
  delete axiosInstance.defaults.headers.Authorization;
};

const forceLogoutRedirect = () => {
  logoutLocal();
  if (typeof window !== "undefined") {
    window.location.href = "/sign-in";
  }
};

let refreshPromise: Promise<string> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// True only when the server has explicitly rejected the refresh token
// (expired/revoked/invalid). Anything else (network error, timeout, 5xx,
// CORS hiccup) is transient and should be retried, not treated as logout.
//
// This backend returns 400 (not 401/403) for an invalid/expired refresh
// token, so it's included here too — otherwise an invalid refresh token
// gets treated as "transient," retried 3x, and never actually logs the
// user out or clears the bad tokens.
const isAuthRejection = (error: unknown) => {
  const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined;
  return httpStatus === 400 || httpStatus === 401 || httpStatus === 403;
};

// ─── Cross-tab refresh coordination ────────────────────────────────────────
// Multiple tabs can be open on the same account, each with its own
// independent auto-refresh timer (see useAutoRefresh). If two tabs try to
// refresh at once and the backend rotates refresh tokens (single-use), the
// tab that loses the race sends an already-consumed refresh token, gets a
// 400 back, and — because that's treated as an auth rejection above —
// immediately force-logs-out and wipes localStorage for every tab, not just
// itself. This lock makes one tab the "leader" that actually talks to the
// backend; the other tabs just wait for the leader to write new tokens to
// localStorage and reuse them instead of racing it.
const REFRESH_LOCK_KEY = "auth:refreshLock";
const REFRESH_LOCK_TTL_MS = 10_000;

const isRefreshLockHeld = (): boolean => {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(REFRESH_LOCK_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < REFRESH_LOCK_TTL_MS;
};

const acquireRefreshLock = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
  }
};

const releaseRefreshLock = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(REFRESH_LOCK_KEY);
  }
};

// Follower tabs poll localStorage for the token the leader tab writes,
// instead of making their own refresh request.
const waitForTokenFromLeader = async (previousAccessToken: string | null): Promise<string> => {
  const start = Date.now();

  while (Date.now() - start < REFRESH_LOCK_TTL_MS) {
    await sleep(150);

    const current = authStorage.getAccessToken();
    if (current && current !== previousAccessToken) {
      return current;
    }

    // Leader finished (or its lock expired) without ever updating tokens —
    // stop waiting and let the caller fall through to its own attempt.
    if (!isRefreshLockHeld()) break;
  }

  throw new Error("Timed out waiting for another tab to refresh the token");
};

const requestNewTokens = async (refreshToken: string) => {
  // The backend's /auth/refresh-token endpoint requires the (expired) access
  // token alongside the refresh token, and returns a flat
  // { token, refreshToken, expiresAt } body — not the nested
  // { token: { token, refreshToken } } shape the login endpoints return.
  // Confirmed directly against the Swagger UI on 2026-07-11.
  const accessToken = authStorage.getAccessToken();

  const { data } = await axios.post(`${baseUrl}/auth/refresh-token`, {
    token: accessToken,
    refreshToken,
  });

  const newAccessToken = data.token;
  const newRefreshToken = data.refreshToken;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error("refresh-token response missing token or refreshToken");
  }

  authStorage.setTokens(newAccessToken, newRefreshToken);
  axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

  return newAccessToken as string;
};

// Refreshes the access token. Concurrent callers within the same tab share
// the same in-flight request instead of firing duplicate refresh calls.
// Concurrent callers across tabs defer to whichever tab wins the
// cross-tab lock (see above) instead of racing it with their own refresh
// token. Only logs the user out when the server explicitly rejects the
// refresh token; transient failures (network blips, timeouts, 5xx) are
// retried with backoff instead.
export const refreshTokens = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const previousAccessToken = authStorage.getAccessToken();

  // Small random jitter before checking the lock. Tabs opened together tend
  // to have near-identical expiry timers and would otherwise all check the
  // (empty) lock at the same instant and all decide to become leader. The
  // jitter desyncs them so the check below actually catches the race.
  await sleep(Math.random() * 250);

  if (isRefreshLockHeld()) {
    refreshPromise = waitForTokenFromLeader(previousAccessToken).finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    forceLogoutRedirect();
    throw new Error("No refresh token available");
  }

  const MAX_ATTEMPTS = 3;

  acquireRefreshLock();

  refreshPromise = (async () => {
    let lastError: unknown;

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          return await requestNewTokens(refreshToken);
        } catch (error) {
          lastError = error;

          if (isAuthRejection(error)) {
            forceLogoutRedirect();
            throw error;
          }

          if (attempt < MAX_ATTEMPTS) {
            await sleep(500 * attempt); // 500ms, 1000ms backoff
          }
        }
      }

      // All retries exhausted on transient errors — don't wipe the session,
      // just surface the error so the caller can decide (e.g. show "offline").
      throw lastError;
    } finally {
      releaseRefreshLock();
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // A first-attempt 401 is handled silently (token refresh + retry) —
    // don't toast it, the user should never see it if the refresh succeeds.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // The token this request was sent with might already be stale
      // because another tab refreshed it in the meantime. If localStorage
      // has a newer token than the one that got rejected, just retry with
      // that instead of kicking off (or waiting on) another refresh.
      const requestToken = (originalRequest.headers?.Authorization as string | undefined)?.replace(
        "Bearer ",
        ""
      );
      const currentToken = authStorage.getAccessToken();

      if (currentToken && requestToken && currentToken !== requestToken) {
        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
        return axiosInstance(originalRequest);
      }

      try {
        const newAccessToken = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        showApiErrorToast(refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Everything else — 400/403/404/409/422/500/network errors, and a 401
    // that already went through a failed refresh — surfaces as a toast.
    showApiErrorToast(error);
    return Promise.reject(error);
  }
);

export default axiosInstance;