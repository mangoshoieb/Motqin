"use client";

import { UserPlus } from "lucide-react";
import { useAuthGate } from "@/app/lib/auth-gate.store";

interface SignUpToUseProps {
  title: string;
  message: string;
}

// Mentorship is for registered users only (guests get 403
// registration_required), so guests see this instead of an empty page.
export const SignUpToUse = ({ title, message }: SignUpToUseProps) => (
  <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
    <p className="max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{message}</p>
    <button
      type="button"
      onClick={() => useAuthGate.getState().open({ kind: "registration_required" })}
      className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
    >
      <UserPlus size={16} />
      إنشاء حساب
    </button>
  </div>
);
