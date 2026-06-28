

export const authStorage = {
    getAccessToken: () => localStorage.getItem("accessToken"),
    getRefreshToken: () => localStorage.getItem("refreshToken"),
  
    setTokens: (access: string, refresh: string) => {
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
    },
  
    clear: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("motqin_user");
    },
  };