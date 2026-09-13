"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";

import { useReportQuoteComment } from "@/app/hooks/useQuoteComment";
import { cn } from "@/app/lib/utils";

// Preset reasons for POST /quotes/comments/report; the last one lets the
// user type their own.
const REASONS = [
  "محتوى غير لائق",
  "إساءة أو تنمّر",
  "رسائل مزعجة أو إعلانات",
  "معلومات مضللة",
  "سبب آخر",
];

const OTHER = REASONS[REASONS.length - 1];

interface ReportCommentDialogProps {
  commentId: number;
  onClose: () => void;
  onReported: () => void;
}

export default function ReportCommentDialog({ commentId, onClose, onReported }: ReportCommentDialogProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const { mutate: reportComment, isPending } = useReportQuoteComment();

  const finalReason = reason === OTHER ? details.trim() : details.trim() ? `${reason} — ${details.trim()}` : reason;

  const submit = () => {
    if (!finalReason) {
      toast.error("يرجى كتابة سبب الإبلاغ.");
      return;
    }
    reportComment(
      { commentId, reason: finalReason },
      {
        onSuccess: () => {
          toast.success("تم إرسال البلاغ، شكرًا لك.");
          onReported();
          onClose();
        },
        onError: () => toast.error("تعذر إرسال البلاغ، حاول مرة أخرى."),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <Flag size={18} className="text-amber-500" />
            الإبلاغ عن تعليق
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="إغلاق"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">ما سبب الإبلاغ عن هذا التعليق؟</p>

        <div className="flex flex-col gap-1.5">
          {REASONS.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                reason === option
                  ? "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300",
              )}
            >
              <input
                type="radio"
                name="report-reason"
                value={option}
                checked={reason === option}
                onChange={() => setReason(option)}
                className="accent-amber-500"
              />
              {option}
            </label>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={reason === OTHER ? "اكتب السبب..." : "تفاصيل إضافية (اختياري)"}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />

        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-zinc-200 px-5 py-2.5 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || (reason === OTHER && !details.trim())}
            className="flex-1 rounded-full bg-amber-500 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "جاري الإرسال..." : "إرسال البلاغ"}
          </button>
        </div>
      </div>
    </div>
  );
}
