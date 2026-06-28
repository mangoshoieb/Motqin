import axios from "axios";
import { authStorage } from "./auth-storage";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// ─── Base Axios Instance ───────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor: Attach Access Token ──────────────────────────────
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

// ─── Response Interceptor: Handle 401 & Auto Refresh Token ────────────────
let isRefreshing = false;
interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const logout = () => {
  authStorage.clear();

  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while a refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authStorage.getRefreshToken()

      if (!refreshToken) {
        // No refresh token — force logout
        authStorage.clear();
        logout()
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${baseUrl}/Authentication/refresh-token`,
          {
            refreshToken,
          }
        );

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        authStorage.setTokens(
          newAccessToken,
          newRefreshToken
        );

        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStorage.clear();
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
