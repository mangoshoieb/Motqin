"use client";

import Script from "next/script";

export default function FacebookSDK() {
  return (
    <Script
      src="https://connect.facebook.net/en_US/sdk.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
          cookie: true,
          xfbml: false,
          version: "v23.0",
        });
      }}
    />
  );
}