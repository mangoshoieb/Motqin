import type { AccountType } from "../lib/account-type";

// The «بياناتك» form fields every sign-up sends (phone-complete-signup,
// the second auth/google call and google/phone-verify). region only for
// Egypt (country 1); stage and grade only for students, grade not for 5.
export interface SignupProfileFields {
  country: number;
  region?: number;
  educationalStage?: number;
  gradeLevel?: number;
  accountType?: AccountType;
  inviterCode?: string;
}

export interface GoogleLoginRequest extends Partial<SignupProfileFields> {
  idToken: string;
  // Second call only (with the form): the name from «بياناتك».
  fullName?: string;
}

// POST /auth/guest — accountType asks for a teacher or parent trial.
export interface GuestLoginRequest {
  accountType?: AccountType;
}

// The code-sending endpoints, while WhatsApp is on hold: sent: false and
// the message text to show on the page for testing.
export interface WhatsAppDebug {
  sent: boolean;
  to?: string;
  otp?: string;
  text?: string;
}

// POST /auth/google/phone-request — step 2 of a Google sign-up.
export interface GooglePhoneRequest {
  idToken: string;
  phoneNumber: string;
}

// POST /auth/google/phone-verify — step 3; signs in with the same token pair.
export interface GooglePhoneVerifyRequest extends GooglePhoneRequest, Partial<SignupProfileFields> {
  code: string;
  fullName?: string;
}

// POST /auth/change-phone-confirm — the new number's token pair.
export interface ChangePhoneConfirmResponse {
  message: string;
  token: AuthTokens;
}

// PUT /users/me — send only what changed. description "" removes it.
export interface UpdateMeRequest {
  fullName?: string;
  region?: number;
  description?: string;
  educationalStage?: number;
  gradeLevel?: number;
}

// The phone-request endpoints all answer with the resend limits.
export interface OtpSentResponse {
  message: string;
  resendCooldownSeconds: number;
  resendsRemaining: number;
  whatsApp?: WhatsAppDebug;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// Either the token pair, or — for a Google account with no confirmed phone
// yet — needsPhone: true and nothing else (no account is created until the
// phone is confirmed).
// A new user's first call answers needsProfile (show «بياناتك», the name
// prefilled from fullName); the second answers a token or needsPhone.
export interface GoogleLoginResponse {
  message?: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  guestDataDiscarded?: boolean;
  needsPhone?: boolean;
  needsProfile?: boolean;
  fullName?: string;
}

// Free uses a guest has left. Separate counters, 3 each.
export interface GuestRemaining {
  studySessions: number;
  spacedRepetitionSessions: number;
}

// POST /auth/guest — same token pair as a login, plus the trial counters.
export interface GuestLoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  guest: {
    isGuest: boolean;
    remaining: GuestRemaining;
  };
}

// Present on the sign-up/login responses when the request carried a guest
// token. true = that phone/Google account already existed, so the
// user was signed into it and the trial work stayed behind on the guest.
export interface GuestUpgradeResult {
  guestDataDiscarded?: boolean;
}

// google
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GoogleInitializeConfig): void;
          prompt(): void;
        };
      };
    };
  }

  interface GoogleInitializeConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }

  interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
  }
}

// phone register and login

declare global {
  interface RegisterPhoneRequest {
    phoneNumber: string;
    name: string;
  }

  interface RegisterPhoneResponse {
    message: string;
  }

  interface LogInPhoneRequest {
    phoneNumber: string;
    // Sign-up page only; checked for a new number before a code is sent.
    inviterCode?: string;
  }
  interface LogInPhoneResponse {
    message: string;
    isNewUser: boolean;
    resendCooldownSeconds: number;
    resendsRemaining: number;
    whatsApp?: WhatsAppDebug;
  }

  interface VerifyPhoneRequest {
    phoneNumber: string;
    code: string;
  }
  interface VerifyPhoneResponse {
    message: string;
    needsSignup: boolean;
    guestDataDiscarded?: boolean;
    token?: {
      token: string;
      refreshToken: string;
      expiresAt: string;
    };
  }

  export interface CompleteProfileRequest extends SignupProfileFields {
    phoneNumber: string;
    name: string;
  }

  export interface CompleteProfileResponse {
    message: string;
    guestDataDiscarded?: boolean;
    token: {
      token: string;
      refreshToken: string;
      expiresAt: string;
    };
  }
  export interface CurrentUserResponse {
    id: string;
    fullName: string;
    email: string;
    emailConfirmed:boolean;
    country: string | number;
    role: string | null;
    gradeLevel: number;
    educationalStage: number;
    isProfileComplete:boolean;
    createdAt:string;
    // Country and region come back as the enum *name* ("Egypt", "Cairo")
    // rather than the integer the API takes, so both are read through the
    // lookup lists (see findLookupItem) before being shown or sent back.
    region?: string | number | null;
    phoneNumber?: string | null;
    phoneNumberConfirmed:boolean;
    roles?: string[];
    // Absolute URL of the profile photo, null until one is uploaded.
    photoUrl?: string | null;
    // The student's own short bio (up to 500 characters); null when empty.
    description?: string | null;
  }
}


// country
// : 
// "Egypt"
// createdAt
// : 
// "2026-07-10T19:25:37.0344492"
// educationalStage
// : 
// 3
// email
// : 
// "amgadmagdy667@gmail.com"
// emailConfirmed
// : 
// true
// fullName
// : 
// "Amgad Shoiep"
// gradeLevel
// : 
// 3
// id
// : 
// "cbf2c704-6a43-4800-8c11-ca73890f8dad"
// isProfileComplete
// : 
// true
// phoneNumber
// : 
// null
// phoneNumberConfirmed
// : 
// false
// region
// : 
// null