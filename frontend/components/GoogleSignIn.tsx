"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";

interface GoogleSignInProps {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
}

// Google's real button, laid invisibly over our own styled button (the page
// draws that one underneath). Only Google's button can hand back the ID token
// the backend's /auth/google expects, so the click has to land on it.
//
// Two things make that reliable:
// - The button is stretched to the full width of the area, so a click
//   anywhere on our button lands on it (by default it is a ~200px iframe in
//   one corner, and clicks beside it did nothing).
// - use_fedcm_for_button is off. On the live HTTPS site Chrome/Edge first try
//   the FedCM sign-in sheet; when that falls back to a popup, the click's
//   user activation is already spent, so the browser blocks the popup
//   ("[GSI_LOGGER]: Failed to open popup window"). Going straight to the
//   popup keeps it inside the click.
export default function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // The iframe is drawn at a fixed pixel width (Google caps it at 400), so
  // measure the area and redraw when it changes.
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
    <div
      ref={boxRef}
      className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-0 [&_iframe]:!h-12 [&>div]:w-full"
    >
      {width > 0 && (
        <GoogleLogin
          key={width}
          onSuccess={(credentialResponse) => {
            if (!credentialResponse.credential) return;
            onSuccess(credentialResponse.credential);
          }}
          onError={() => onError?.()}
          size="large"
          width={width}
          use_fedcm_for_button={false}
        />
      )}
    </div>
  );
}
