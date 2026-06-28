"use client";

import { useEffect } from "react";

interface FacebookProviderProps {
  children: React.ReactNode;
}

export default function FacebookProvider({
  children,
}: FacebookProviderProps) {
  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
        cookie: true,
        xfbml: false,
        version: "v23.0",
      });
    };
  }, []);

  return <>{children}</>;
}