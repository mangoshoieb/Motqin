"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { getInviterCode, setInviterCode } from "@/app/lib/invite-code";

// كود الدعوة (اختياري). Filled from ?inviterCode= (kept by
// InviterCodeCapture) and written back to sessionStorage on every change,
// so every signup request sends what is typed here (withInviterCode).
export default function InviterCodeField({
  error,
  onChange,
}: {
  error?: string;
  onChange?: () => void;
}) {
  const [code, setCode] = useState("");

  // sessionStorage is only readable in the browser.
  useEffect(() => {
    const timeout = setTimeout(() => setCode(getInviterCode()), 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <CustomInput
      label="كود الدعوة (اختياري)"
      placeholder="7595148B"
      dir="ltr"
      autoComplete="off"
      maxLength={32}
      icon={<Ticket size={18} />}
      value={code}
      error={error}
      onChange={(event) => {
        setCode(event.target.value);
        setInviterCode(event.target.value);
        onChange?.();
      }}
    />
  );
}
