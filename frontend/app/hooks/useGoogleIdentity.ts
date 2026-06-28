import { useEffect } from "react";

export function useGoogleIdentity({ onSuccess }: Props) {
    useEffect(() => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: (response) => {
          onSuccess(response.credential);
        },
      });
    }, [onSuccess]);
  }
  