"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, Loader2, MessageSquareText, RotateCcw } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { formatMoment } from "@/app/lib/date";
import { apiErrorCode, formatNumber } from "@/app/lib/tracking-table";
import {
  REPORT_PLAN_CODES,
  REPORT_STATUS_META,
  SKIP_REASON_LABELS,
} from "@/app/constants/tracking-table.constants";
import { useAllowReport, useReport, useStopReport } from "@/app/hooks/useTrackingTables";
import { ReportBatchMessage, ReportCounts, ReportMessageStatus } from "@/app/types/tracking-table.types";
import { Modal, primaryButton, secondaryButton } from "../ui";

const SEGMENTS: { key: keyof ReportCounts; status: ReportMessageStatus; bar: string }[] = [
  { key: "sent", status: "Sent", bar: "bg-emerald-500 dark:bg-emerald-700" },
  { key: "sending", status: "Sending", bar: "bg-indigo-500 dark:bg-indigo-700 animate-pulse" },
  { key: "queued", status: "Queued", bar: "bg-blue-400 dark:bg-blue-600" },
  { key: "failed", status: "Failed", bar: "bg-rose-500 dark:bg-rose-700" },
  { key: "skipped", status: "Skipped", bar: "bg-amber-400 dark:bg-amber-600" },
  { key: "cancelled", status: "Cancelled", bar: "bg-zinc-400" },
  { key: "draft", status: "Draft", bar: "bg-zinc-300" },
];

export const reportTotal = (counts: ReportCounts) =>
  SEGMENTS.reduce((sum, s) => sum + (counts[s.key] ?? 0), 0);

// Sent / failed / waiting as one bar.
export function CountsBar({ counts, className }: { counts: ReportCounts; className?: string }) {
  const total = reportTotal(counts) || 1;
  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800", className)}>
      {SEGMENTS.map((s) =>
        counts[s.key] ? (
          <div key={s.key} className={s.bar} style={{ width: `${((counts[s.key] ?? 0) / total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: ReportMessageStatus }) {
  const meta = REPORT_STATUS_META[status] ?? REPORT_STATUS_META.Draft;
  return <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold", meta.className)}>{meta.label}</span>;
}

// Shown when a send is refused for the plan: the way to fix it.
export function PlanNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="font-semibold">{message}</p>
      <p className="mt-1 text-xs opacity-80">رسائل أولياء الأمور جزء من باقات المعلمين.</p>
      <Link href="/subscription" className="mt-3 inline-flex rounded-lg bg-amber-500 dark:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 dark:hover:bg-amber-700">
        عرض الباقات
      </Link>
    </div>
  );
}

// One parent's line. A Sent message that didn't really go out (sending is on
// hold) opens the WhatsApp text the parent would get. whatsApp is null on
// every status but Sent.
function MessageRow({ message: m }: { message: ReportBatchMessage }) {
  const [open, setOpen] = useState(false);
  const preview = m.status === "Sent" && m.whatsApp && !m.whatsApp.sent ? m.whatsApp : null;
  const detail = m.error
    ? { text: m.error, className: "text-rose-600 dark:text-rose-400" }
    : m.status === "Skipped" && m.reason
      ? { text: SKIP_REASON_LABELS[m.reason] ?? m.reason, className: "text-amber-700 dark:text-amber-400" }
      : null;

  return (
    <li className="px-4 py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{m.student}</p>
          {detail ? (
            <p className={cn("truncate text-xs", detail.className)}>{detail.text}</p>
          ) : (
            m.phone && (
              <p dir="ltr" className="text-right text-xs tabular-nums text-zinc-500">
                {m.phone}
              </p>
            )
          )}
        </div>
        {preview && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
          >
            <MessageSquareText size={14} /> الرسالة
          </button>
        )}
        <StatusChip status={m.status} />
      </div>
      {preview && open && (
        <div className="mt-2 rounded-2xl bg-[#e5ddd5] p-3 dark:bg-zinc-800">
          <p className="mb-2 text-center text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            لم تُرسل فعلياً — هذا ما سيصل لولي الأمر
          </p>
          <div className="ms-auto max-w-[90%] rounded-xl rounded-se-sm bg-[#dcf8c6] px-3 py-2 text-[13px] leading-6 text-zinc-900 shadow-sm dark:bg-emerald-900/60 dark:text-zinc-100">
            <p dir="auto" className="whitespace-pre-line break-words">
              {preview.text}
            </p>
            {m.sentAt && (
              <p className="mt-1 text-end text-[10px] text-zinc-500 dark:text-zinc-400">{formatMoment(m.sentAt, "time")}</p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

// Live progress of one report, per parent. Polls while anything is waiting.
export function ReportStatusView({ batchId }: { batchId: string }) {
  const { data: report, isLoading } = useReport(batchId);
  const stop = useStopReport();
  const allow = useAllowReport();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<{ message: string; plan: boolean } | null>(null);

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const c = report.counts;
  const active = (c.queued ?? 0) + (c.sending ?? 0);
  const resumable = (c.cancelled ?? 0) + (c.draft ?? 0) > 0 && active === 0;

  const resume = () => {
    setError(null);
    allow.mutate(batchId, {
      onError: (err) =>
        setError({ message: getApiErrorMessage(err), plan: REPORT_PLAN_CODES.includes(apiErrorCode(err) ?? "") }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-bold text-zinc-900 dark:text-zinc-100">
            {report.template} · {report.groupName}
          </p>
          {active > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Loader2 size={12} className="animate-spin" /> جارٍ الإرسال
            </span>
          )}
        </div>
        <CountsBar counts={c} className="mt-3" />
        <div className="mt-3 flex flex-wrap gap-2">
          {SEGMENTS.filter((s) => c[s.key]).map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              <span className={cn("size-2 rounded-full", s.bar)} />
              {REPORT_STATUS_META[s.status].label} {formatNumber(c[s.key] ?? 0)}
            </span>
          ))}
        </div>
      </div>

      {(report.messages?.length ?? 0) > 0 && (
        <ul className="max-h-96 divide-y divide-zinc-100 overflow-y-auto rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {report.messages!.map((m, i) => (
            <MessageRow key={m.rowId ?? i} message={m} />
          ))}
        </ul>
      )}

      {active > 0 && (
        <button
          type="button"
          onClick={() => stop.mutate(batchId)}
          disabled={stop.isPending}
          className={cn(secondaryButton, "text-rose-600 dark:text-rose-400")}
        >
          <Ban size={16} /> إيقاف ما لم يُرسل بعد
        </button>
      )}

      {resumable && (
        <div className="flex flex-col gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            أؤكد أن أولياء الأمور وافقوا على استلام هذه الرسائل.
          </label>
          <button type="button" onClick={resume} disabled={!consent || allow.isPending} className={primaryButton}>
            <RotateCcw size={16} /> {allow.isPending ? "جارٍ البدء..." : "إرسال الرسائل المتبقية"}
          </button>
        </div>
      )}

      {error &&
        (error.plan ? (
          <PlanNotice message={error.message} />
        ) : (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error.message}</p>
        ))}
    </div>
  );
}

export function ReportStatusDialog({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  return (
    <Modal title="حالة التقرير" description="الرسائل المرسلة لا يمكن استرجاعها." onClose={onClose}>
      <ReportStatusView batchId={batchId} />
    </Modal>
  );
}
