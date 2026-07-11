export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface GoogleLoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
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

// facebook

// export {};

declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }

  interface FacebookSDK {
    init(options: FacebookInitOptions): void;

    login(
      callback: (response: FacebookLoginResponse) => void,
      options?: FacebookLoginOptions
    ): void;
  }

  interface FacebookInitOptions {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }

  interface FacebookLoginOptions {
    scope?: string;
  }
  export interface FacebookLoginRequest {
    accessToken: string;
  }

  interface FacebookLoginResponse {
    
    token: string;
    refreshToken: string;
    status: "connected" | "not_authorized" | "unknown";

    authResponse?: FacebookAuthResponse;
  }

  interface FacebookAuthResponse {
    accessToken: string;
    expiresIn: number;
    userID: string;
    signedRequest: string;
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
  }
  interface LogInPhoneResponse {
    message: string;
    isNewUser: boolean;
    resendCooldownSeconds: number;
    resendsRemaining: number;
  }

  interface VerifyPhoneRequest {
    phoneNumber: string;
    code: string;
  }
  interface VerifyPhoneResponse {
    message: string;
    needsSignup: boolean;
    token?: {
      token: string;
      refreshToken: string;
      expiresAt: string;
    };
  }

  export interface CompleteProfileRequest {
    phoneNumber: string;
    name: string;
    region: string;
  }

  export interface CompleteProfileResponse {
    message: string;
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
    country: string;
    role: string | null;
    gradeLevel: number;
    educationalStage: number;
    isProfileComplete:boolean;
    // Not yet returned by GET /users/me — kept optional until the backend
    // exposes it, so the profile page's region field has somewhere to live.
    createdAt:string;
    region?: string;
    phoneNumberConfirmed:boolean
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