import { API_ROUTES } from "@/app/constants/planner.constants";
import axiosInstance from "../lib/axios";
import {
  GoogleLoginRequest,
  GoogleLoginResponse,
  GooglePhoneRequest,
  GooglePhoneVerifyRequest,
  GuestLoginResponse,
  OtpSentResponse,
} from "../types/auth.types";
import { authStorage } from "../lib/auth-storage";

// const refreshToken = authStorage.getRefreshToken();

export const authService = {
  // Starts (or resumes) a no-account trial. The same X-Device-Id always
  // gets the same guest back, so reinstalling doesn't reset the trial.
  async signInAsGuest(): Promise<GuestLoginResponse> {
    const { data } = await axiosInstance.post<GuestLoginResponse>(
      API_ROUTES.AUTH.GUEST,
      {},
      { headers: { "X-Device-Id": authStorage.getDeviceId() } }
    );

    return data;
  },

  async googleLogin(body: GoogleLoginRequest): Promise<GoogleLoginResponse> {
    const { data } = await axiosInstance.post<GoogleLoginResponse>(
      API_ROUTES.AUTH.GOOGLE,
      body
    );

    return data;
  },

  // Google sign-up, step 2: a code goes to this phone's WhatsApp.
  async googlePhoneRequest(body: GooglePhoneRequest): Promise<OtpSentResponse> {
    const { data } = await axiosInstance.post<OtpSentResponse>(
      API_ROUTES.AUTH.GOOGLE_PHONE_REQUEST,
      body
    );

    return data;
  },

  // Step 3: links Google to the account that owns the phone, or creates one
  // (upgrading the guest trial if the request carries a guest token).
  async googlePhoneVerify(body: GooglePhoneVerifyRequest): Promise<GoogleLoginResponse> {
    const { data } = await axiosInstance.post<GoogleLoginResponse>(
      API_ROUTES.AUTH.GOOGLE_PHONE_VERIFY,
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

  // PUT /users/{id} — UserUpdateDto: name (required), role, gradeLevel.
  async updateProfile(
    id: string,
    payload: { name: string; role?: string | null; gradeLevel?: number },
  ): Promise<void> {
    await axiosInstance.put(API_ROUTES.USERS.UPDATE(id), payload);
  },

  // POST /users/upload-photo — multipart with a single `Photo` part. The
  // backend stores the file and sets the user's photoUrl; GET /users/me
  // returns the new URL afterwards.
  async uploadProfilePhoto(file: File): Promise<void> {
    const form = new FormData();
    form.append("Photo", file);
    // Let the browser set the multipart boundary.
    await axiosInstance.post(API_ROUTES.USERS.UPLOAD_PHOTO, form, {
      headers: { "Content-Type": undefined },
    });
  },

  async logout(): Promise<{ message: string }> {
    const refreshToken = authStorage.getRefreshToken();

    const { data } = await axiosInstance.post(API_ROUTES.AUTH.LOGOUT, {
      refreshToken,
    });

    return data;
  },
};
