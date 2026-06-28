export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface GoogleLoginResponse {
  message: string;
  tokens: AuthTokens;
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
  tokens: {
    accessToken: string;
    refreshToken: string;
};
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

interface VerifyPhoneRequest {
  phoneNumber: string;
  code: string;
}
 interface VerifyPhoneResponse {
  message: string;
  token: {
    accessToken: string;
    refreshToken: string;
    expiredAt: string;
  };
}
}