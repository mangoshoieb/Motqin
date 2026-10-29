"use client";

import { useState } from "react";
import { ChevronLeft, MessageCircle } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { useReports } from "@/app/hooks/useTrackingTables";
import { formatNumber } from "@/app/lib/tracking-table";
import { CountsBar, ReportStatusDialog, reportTotal } from "./ReportStatus";

const dateTime = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Every report sent (and any prepared but never sent), newest first.
export function ReportsHistory() {
  const { data: reports, isLoading } = useReports();
  const [open, setOpen] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!reports?.length) {
    return (
      <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-zinc-300 bg-white px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
          <MessageCircle size={26} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">لم ترسل تقارير بعد</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          افتح أي جدول واضغط &quot;إرسال تقرير&quot; لإرسال النتائج أو الحضور لأولياء الأمور على واتساب.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {reports.map((report) => {
          const c = report.counts ?? {};
          return (
            <li key={report.batchId}>
              <button
                type="button"
                onClick={() => setOpen(report.batchId)}
                className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-start transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
                  <MessageCircle size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                    {report.template} · {report.groupName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {report.createdAt ? dateTime.format(new Date(report.createdAt)) : ""}
                    {" · "}
                    {(c.draft ?? 0) > 0 && !c.sent
                      ? "لم يُرسل بعد"
                      : `أُرسل ${formatNumber(c.sent ?? 0)} من ${formatNumber(reportTotal(c))}`}
                    {c.failed ? ` · فشل ${formatNumber(c.failed)}` : ""}
                  </p>
                  <CountsBar counts={c} className="mt-2 max-w-sm" />
                </div>
                <ChevronLeft size={18} className="shrink-0 text-zinc-400" />
              </button>
            </li>
          );
        })}
      </ul>
      {open && <ReportStatusDialog batchId={open} onClose={() => setOpen(null)} />}
    </>
  );
}
