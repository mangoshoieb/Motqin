"use client";

import { useAuthStore } from "@/app/lib/auth.store";

// Test only, while WhatsApp sending is on hold: the server answers
// whatsApp.sent: false with the message it would have sent. Remove this box
// once sending goes live.
export default function WhatsAppDebugBox() {
  const debug = useAuthStore((state) => state.whatsAppDebug);
  if (!debug?.text && !debug?.otp) return null;

  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="font-semibold">للاختبار فقط: لم تُرسل رسالة واتساب</p>
      <p>{debug.text ?? `رمز التحقق: ${debug.otp}`}</p>
    </div>
  );
}
