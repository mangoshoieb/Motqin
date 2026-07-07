import { API_ROUTES } from "@/app/constants/planner.constants";
import axiosInstance from "../lib/axios";
import { GoogleLoginRequest, GoogleLoginResponse } from "../types/auth.types";
import { authStorage } from "../lib/auth-storage";

// const refreshToken = authStorage.getRefreshToken();

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
  async registerPhone(
    body: RegisterPhoneRequest
  ): Promise<RegisterPhoneResponse> {
    const { data } = await axiosInstance.post<RegisterPhoneResponse>(
      API_ROUTES.AUTH.REGISTER_PHONE,
      body
    );

    return data;
  },
  async logInPhone(body: LogInPhoneRequest): Promise<LogInPhoneResponse> {
    const { data } = await axiosInstance.post<LogInPhoneResponse>(
      API_ROUTES.AUTH.LOGIN_PHONE,
      body
    );

    return data;
  },

  async verifyPhone(body: VerifyPhoneRequest): Promise<VerifyPhoneResponse> {
    const { data } = await axiosInstance.post<VerifyPhoneResponse>(
      API_ROUTES.AUTH.VERIFY_PHONE,
      body
    );

    return data;
  },
  async completeProfile(
    body: CompleteProfileRequest
  ): Promise<CompleteProfileResponse> {
    const { data } = await axiosInstance.post<CompleteProfileResponse>(
      API_ROUTES.AUTH.COMPLETE_PROFILE,
      body
    );

    return data;
  },
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } = await axiosInstance.get(API_ROUTES.USERS.CURRENT_USER);

    return data;
  },

  async logout(): Promise<{ message: string }> {
    const refreshToken = authStorage.getRefreshToken();

    const { data } = await axiosInstance.post(API_ROUTES.AUTH.LOGOUT, {
      refreshToken,
    });

    return data;
  },
};
