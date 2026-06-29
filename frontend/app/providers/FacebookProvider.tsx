"use client";

import Script from "next/script";

export default function FacebookSDK() {
  return (
    <>
      <Script
        id="facebook-init"
        strategy="afterInteractive"
      >
        {`
          window.fbAsyncInit = function () {
            FB.init({
              appId: "${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}",
              cookie: true,
              xfbml: false,
              version: "v23.0"
            });

            console.log("Facebook Initialized");
          };
        `}
      </Script>

      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
      />
    </>
  );
}