"use client";

import { useEffect } from "react";
import { saveInviterCodeFromUrl } from "@/app/lib/invite-code";

// Keeps ?inviterCode=… from an invite link (/sign-up?inviterCode=…) for the
// rest of signup — see app/lib/invite-code.ts.
export default function InviterCodeCapture() {
  useEffect(() => {
    saveInviterCodeFromUrl();
  }, []);
  return null;
}
