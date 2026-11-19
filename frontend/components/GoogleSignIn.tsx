"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

interface GoogleSignInProps {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
  // "continue_with" on sign-in, "signup_with" on sign-up.
  text?: "continue_with" | "signup_with" | "signin_with";
}

// Google's own button, shown as-is. It used to sit invisible (opacity 0)
// over a custom button, and on the live site the popup it opened was
// blocked ("[GSI_LOGGER]: Failed to open popup window"). Google draws this
// button in its own iframe, so its font and border can't be styled — only
// the options below.
export default function GoogleSignIn({ onSuccess, onError, text = "continue_with" }: GoogleSignInProps) {
  const { resolvedTheme } = useTheme();
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // The iframe is drawn at a fixed pixel width (Google caps it at 400), so
  // measure the space it has and redraw when that changes.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.min(400, Math.floor(entry.contentRect.width)));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="flex h-11 w-full justify-center">
      {width > 0 && (
        <GoogleLogin
          key={`${width}-${resolvedTheme}`}
          onSuccess={(credentialResponse) => {
            if (!credentialResponse.credential) return;
            onSuccess(credentialResponse.credential);
          }}
          onError={() => onError?.()}
          theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
          size="large"
          shape="rectangular"
          text={text}
          width={width}
          // Chrome/Edge show their own Google account sheet (FedCM) instead
          // of a popup window. On the live site the popup was refused by the
          // browser ("[GSI_LOGGER]: Failed to open popup window"); browsers
          // without FedCM still fall back to the popup.
          use_fedcm_for_button
        />
      )}
    </div>
  );
}
