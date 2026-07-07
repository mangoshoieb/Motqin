import axios from "axios";
import { authStorage } from "./auth-storage";

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
const isAuthRejection = (error: unknown) => {
  const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined;
  return httpStatus === 401 || httpStatus === 403;
};

const requestNewTokens = async (refreshToken: string) => {
  const { data } = await axios.post(`${baseUrl}/auth/refresh-token`, {
    refreshToken,
  });

  const newAccessToken = data.token.token;
  const newRefreshToken = data.token.refreshToken;

  authStorage.setTokens(newAccessToken, newRefreshToken);
  axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

  return newAccessToken as string;
};

// Refreshes the access token. Concurrent callers share the same in-flight
// request instead of firing duplicate refresh calls. Only logs the user out
// when the server explicitly rejects the refresh token; transient failures
// (network blips, timeouts, 5xx) are retried with backoff instead.
export const refreshTokens = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    forceLogoutRedirect();
    throw new Error("No refresh token available");
  }

  const MAX_ATTEMPTS = 3;

  refreshPromise = (async () => {
    let lastError: unknown;

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
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;