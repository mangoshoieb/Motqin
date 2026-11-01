"use client";

import { Smartphone } from "lucide-react";
import { MentorLockCard } from "@/components/Blocker/MentorLockCard";
import { SchedulesSection } from "@/components/Blocker/SchedulesSection";
import { BlockerSummaryCard } from "@/components/Blocker/BlockerSummaryCard";
import { FocusSessionCard } from "@/components/Focus/FocusSessionCard";

export default function FocusPage() {
  return (
    <main className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">منع المشتتات</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            حدد متى يحجب هاتفك التطبيقات والمواقع المشتتة.
          </p>
        </header>

        <div className="space-y-5">
          {/* Leads the page: nothing here blocks anything in the browser, and
              the student should know that before reading a single schedule. */}
          <div className="flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <Smartphone size={22} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">الحجب يعمل من تطبيق متقن على هاتفك فقط</p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed opacity-90">
                ما تضبطه هنا يصل إلى هاتفك تلقائيًا، والهاتف هو من يبدأ الحجب في موعده وينهيه، حتى دون
                إنترنت. أثناء حجب يعمل لا يمكن تعديل الجداول أو حذفها، لكن يمكنك دائمًا إضافة جدول جديد.
              </p>
            </div>
          </div>

          <MentorLockCard />

          <SchedulesSection />

          <BlockerSummaryCard />

          {/* Works in the browser on its own — no phone needed. */}
          <FocusSessionCard />
        </div>
      </div>
    </main>
  );
}
