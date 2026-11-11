"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageCircle, Users } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { apiErrorCode, formatNumber } from "@/app/lib/tracking-table";
import {
  REPORT_BLANK_SOURCES,
  REPORT_PLAN_CODES,
  REPORT_TEXT_PREFIX,
  SKIP_REASON_LABELS,
} from "@/app/constants/tracking-table.constants";
import { useAllowReport, usePrepareReport, useReportTemplates } from "@/app/hooks/useTrackingTables";
import { ReportPreview, ReportTemplate, TrackingColumn } from "@/app/types/tracking-table.types";
import { Modal, inputClass, primaryButton, secondaryButton } from "../ui";
import { PlanNotice, ReportStatusView } from "./ReportStatus";

const TEXT = "__text__";

// A blank is filled from a fixed source, a column, or typed text.
interface Blank {
  source: string; // REPORT_BLANK_SOURCES value, a column id, or TEXT
  text: string;
}

const blankValue = (blank: Blank) => (blank.source === TEXT ? `${REPORT_TEXT_PREFIX}${blank.text.trim()}` : blank.source);

// "ولي أمر الطالب {{1}}، ..." split into text and numbered blanks.
const templateParts = (body: string) => body.split(/(\{\{\d+\}\})/g);

const defaultBlanks = (template: ReportTemplate): Blank[] =>
  Array.from({ length: template.blanks }, (_, i) => ({ source: i === 0 ? "studentName" : "", text: "" }));

export function ReportDialog({
  groupId,
  columns,
  rowIds,
  onClose,
  canSend = true,
}: {
  groupId: string;
  columns: TrackingColumn[];
  rowIds: number[] | null; // null = every student
  onClose: () => void;
  // An assistant may prepare a report (PrepareReports) without being allowed
  // to send it (SendReports): the teacher sends it from their reports list.
  canSend?: boolean;
}) {
  const { data: templates = [] } = useReportTemplates();
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [consent, setConsent] = useState(false);
  const [sentBatch, setSentBatch] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; plan: boolean } | null>(null);
  const prepare = usePrepareReport(groupId);
  const allow = useAllowReport();

  const template = templates.find((t) => t.key === templateKey) ?? null;

  const sourceLabel = (blank: Blank | undefined) => {
    if (!blank?.source) return null;
    if (blank.source === TEXT) return blank.text.trim() || null;
    return (
      REPORT_BLANK_SOURCES.find((s) => s.value === blank.source)?.label ??
      columns.find((c) => c.id === blank.source)?.name ??
      null
    );
  };

  const blanksReady = blanks.length > 0 && blanks.every((b) => b.source && (b.source !== TEXT || b.text.trim()));

  const fail = (err: unknown) =>
    setError({ message: getApiErrorMessage(err), plan: REPORT_PLAN_CODES.includes(apiErrorCode(err) ?? "") });

  const buildPreview = () => {
    if (!template || !blanksReady) return;
    setError(null);
    prepare.mutate(
      { templateKey: template.key, blanks: blanks.map(blankValue), rowIds },
      { onSuccess: setPreview, onError: fail },
    );
  };

  const send = () => {
    if (!preview) return;
    setError(null);
    allow.mutate(preview.batchId, { onSuccess: () => setSentBatch(preview.batchId), onError: fail });
  };

  const recipients = rowIds ? `${formatNumber(rowIds.length)} طالب محدد` : "كل طلاب الجدول";

  // --- Step 3: sending ---
  if (sentBatch) {
    return (
      <Modal title="جارٍ إرسال التقرير" description="يمكنك إغلاق هذه النافذة، الإرسال يستمر." onClose={onClose}>
        <ReportStatusView batchId={sentBatch} />
      </Modal>
    );
  }

  // --- Step 2: preview, consent, send ---
  if (preview) {
    const q = preview.quota;
    const planBlocked =
      REPORT_PLAN_CODES.includes(q?.code ?? "") || (q?.remaining != null && q.needed > q.remaining);
    return (
      <Modal
        title="مراجعة التقرير قبل الإرسال"
        description="لم يُرسل شيء بعد."
        onClose={onClose}
        className="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={() => setPreview(null)} className={cn(secondaryButton, "flex-1")}>
              رجوع
            </button>
            {canSend ? (
              <button
                type="button"
                onClick={send}
                disabled={!consent || planBlocked || preview.ready === 0 || allow.isPending}
                className={cn(primaryButton, "flex-1 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800")}
              >
                <MessageCircle size={17} />
                {allow.isPending ? "جارٍ البدء..." : `إرسال ${formatNumber(preview.ready)} رسالة`}
              </button>
            ) : (
              <button type="button" onClick={onClose} className={cn(primaryButton, "flex-1")}>
                تم التجهيز
              </button>
            )}
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <Stat label="جاهزة" value={preview.ready} className="text-emerald-600 dark:text-emerald-400" />
          <Stat label="سيتم تخطيها" value={preview.skipped} className="text-amber-600 dark:text-amber-400" />
          <Stat
            label="المتبقي في باقتك"
            value={q?.remaining ?? null}
            className={planBlocked ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}
          />
        </div>

        {planBlocked && (
          <div className="mt-4">
            <PlanNotice
              message={
                q?.code === "not_in_plan"
                  ? "رسائل أولياء الأمور غير متاحة في باقتك الحالية."
                  : `تحتاج ${formatNumber(q.needed)} رسالة والمتبقي ${formatNumber(q.remaining ?? 0)}.`
              }
            />
          </div>
        )}

        <p className="mb-2 mt-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">أمثلة من الرسائل</p>
        <div className="flex flex-col gap-2 rounded-2xl bg-[#efeae2] p-3 dark:bg-zinc-950">
          {preview.messages.slice(0, 4).map((m) => (
            <div key={m.rowId} className="max-w-[85%] self-start rounded-2xl rounded-tr-sm bg-white px-3.5 py-2 text-sm shadow-sm dark:bg-zinc-800">
              <p className="mb-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {m.student} · <span dir="ltr">{m.phone}</span>
              </p>
              <p className="leading-6 text-zinc-800 dark:text-zinc-100">{m.text}</p>
            </div>
          ))}
          {preview.messages.length === 0 && <p className="py-4 text-center text-sm text-zinc-500">لا توجد رسائل جاهزة.</p>}
        </div>

        {preview.skippedRows.length > 0 && (
          <details className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} /> {formatNumber(preview.skippedRows.length)} طالب لن تصلهم رسالة
            </summary>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-amber-900 dark:text-amber-200">
              {preview.skippedRows.map((s) => (
                <li key={s.rowId}>
                  <span className="font-semibold">{s.student}:</span> {SKIP_REASON_LABELS[s.reason] ?? s.reason}
                  {s.blank ? ` (خانة ${s.blank})` : ""}
                </li>
              ))}
            </ul>
          </details>
        )}

        {canSend ? (
          <label className="mt-5 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            أؤكد أن أولياء الأمور وافقوا على استلام هذه الرسائل على واتساب.
          </label>
        ) : (
          <p className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
            جهّزت التقرير ولم يُرسل شيء. الإرسال يحتاج صلاحية «إرسال التقارير» من المعلم، ويجده المعلم في تقاريره
            المجهّزة.
          </p>
        )}

        {error && <div className="mt-3">{error.plan ? <PlanNotice message={error.message} /> : <p className="text-sm text-rose-600 dark:text-rose-400">{error.message}</p>}</div>}
      </Modal>
    );
  }

  // --- Step 1: template and blanks ---
  return (
    <Modal
      title="إرسال تقرير لأولياء الأمور"
      description={
        <span className="inline-flex items-center gap-1.5">
          <Users size={14} /> {recipients} · على واتساب
        </span>
      }
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button
            type="button"
            onClick={buildPreview}
            disabled={!blanksReady || prepare.isPending}
            className={cn(primaryButton, "flex-1")}
          >
            {prepare.isPending ? "جارٍ التجهيز..." : "معاينة الرسائل"}
          </button>
        </>
      }
    >
      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">نوع الرسالة</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTemplateKey(t.key);
              setBlanks(defaultBlanks(t));
            }}
            className={cn(
              "rounded-2xl border p-3 text-start transition",
              templateKey === t.key
                ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 dark:bg-emerald-500/10"
                : "border-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 dark:border-zinc-700",
            )}
          >
            <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {templateKey === t.key && <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />}
              {t.label}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{t.body}</p>
          </button>
        ))}
      </div>

      {template && (
        <>
          <p className="mb-2 mt-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">املأ الخانات</p>
          <div className="flex flex-col gap-2">
            {blanks.map((blank, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {i + 1}
                </span>
                <select
                  value={blank.source}
                  onChange={(e) =>
                    setBlanks((prev) => prev.map((b, j) => (j === i ? { ...b, source: e.target.value } : b)))
                  }
                  className={cn(inputClass, "py-2")}
                >
                  <option value="">اختر...</option>
                  <optgroup label="بيانات ثابتة">
                    {REPORT_BLANK_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                  {columns.length > 0 && (
                    <optgroup label="من أعمدة الجدول">
                      {columns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value={TEXT}>نص أكتبه بنفسي</option>
                </select>
                {blank.source === TEXT && (
                  <input
                    dir="auto"
                    value={blank.text}
                    onChange={(e) =>
                      setBlanks((prev) => prev.map((b, j) => (j === i ? { ...b, text: e.target.value } : b)))
                    }
                    placeholder="مثال: امتحان الشهر"
                    className={cn(inputClass, "py-2")}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="mb-2 mt-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">شكل الرسالة</p>
          <div className="rounded-2xl bg-[#efeae2] p-3 dark:bg-zinc-950">
            <p className="max-w-[90%] rounded-2xl rounded-tr-sm bg-white px-3.5 py-2.5 text-sm leading-7 text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-100">
              {templateParts(template.body).map((part, i) => {
                const match = part.match(/^\{\{(\d+)\}\}$/);
                if (!match) return <Fragment key={i}>{part}</Fragment>;
                const label = sourceLabel(blanks[Number(match[1]) - 1]);
                return (
                  <span
                    key={i}
                    className={cn(
                      "mx-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold",
                      label
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                        : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700",
                    )}
                  >
                    {label ?? `خانة ${match[1]}`}
                  </span>
                );
              })}
            </p>
          </div>
        </>
      )}

      {error && <div className="mt-4">{error.plan ? <PlanNotice message={error.message} /> : <p className="text-sm text-rose-600 dark:text-rose-400">{error.message}</p>}</div>}
    </Modal>
  );
}

function Stat({ label, value, className }: { label: string; value: number | null; className?: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-3 py-3 text-center dark:bg-zinc-800/60">
      <p className={cn("text-2xl font-bold tabular-nums", className)}>{value === null ? "—" : formatNumber(value)}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
