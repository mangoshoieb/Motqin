import { API_ROUTES } from "@/app/constants/planner.constants";
import axiosInstance from "../lib/axios";
import { GoogleLoginRequest, GoogleLoginResponse } from "../types/auth.types";

export const authService = {
  async googleLogin(body: GoogleLoginRequest): Promise<GoogleLoginResponse> {
    const { data } = await axiosInstance.post<GoogleLoginResponse>(
      API_ROUTES.AUTH.GOOGLE,
      body
    );

    return data;
  },

  async facebookLogin(
    body: FacebookLoginRequest
  ): Promise<FacebookLoginResponse> {
    const { data } = await axiosInstance.post<FacebookLoginResponse>(
      API_ROUTES.AUTH.FACEBOOK,
      body
    );

    return data;
  },
};
