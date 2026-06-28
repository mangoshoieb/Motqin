"use client";

import { GoogleLogin } from "@react-oauth/google";
import { forwardRef } from "react";

interface GoogleSignInProps {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
}

const GoogleSignIn = forwardRef<HTMLDivElement, GoogleSignInProps>(
  ({ onSuccess, onError }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (!credentialResponse.credential) return;

            onSuccess(credentialResponse.credential);
          }}
          onError={() => {
            onError?.();
          }}
        />
      </div>
    );
  }
);

GoogleSignIn.displayName = "GoogleSignIn";

export default GoogleSignIn;