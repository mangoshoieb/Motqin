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
  },

  clear: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  getAccessTokenExpiry: (): number | null => {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  },
};
