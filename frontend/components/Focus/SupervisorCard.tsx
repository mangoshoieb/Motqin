"use client";

import { useState } from "react";
import { Mail, ShieldQuestion, Trash2, Clock3, CheckCircle2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useAddSupervisor,
  useRemoveSupervisor,
} from "@/app/hooks/useDistractionControls";
import { Supervisor } from "@/app/types/focus.types";

// Deliberately framed as self-commitment, not parental control: the student
// chooses a mentor to bind their own future self, the way you'd hand someone
// else the key. Research on teen-facing control apps is consistent that
// imposed surveillance breeds workarounds, while an agreed-on lock the student
// opted into actually holds.
interface SupervisorCardProps {
  supervisor: Supervisor | null;
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const SupervisorCard = ({ supervisor }: SupervisorCardProps) => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const { mutate: addSupervisor, isPending } = useAddSupervisor();
  const { mutate: removeSupervisor } = useRemoveSupervisor();

  const emailError = touched && email.length > 0 && !isValidEmail(email);

  const handleAdd = () => {
    setTouched(true);
    if (!isValidEmail(email)) return;

    addSupervisor(email.trim());
    setEmail("");
    setTouched(false);
  };

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      dir="rtl"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <ShieldQuestion className="text-orange-500" size={22} />
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            إعدادات المشرف
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            اختياري — أنت من يقرر إضافته
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/25 dark:text-orange-200">
        <p className="font-semibold">إضافة مشرف تجعل تغيير إعدادات الحجب أصعب — عن قصد.</p>
        <p className="mt-1.5 opacity-90">
          الفكرة بسيطة: أنت الآن، وأنت وقت الملل، شخصان مختلفان. المشرف هو اتفاقك مع نفسك
          الأولى. بعد التفعيل، إلغاء الحجب أو تعديله سيحتاج موافقة المشرف عبر بريده.
        </p>
      </div>

      {supervisor ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Mail size={18} />
            </span>

            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                {supervisor.email}
              </p>

              <span
                className={cn(
                  "mt-0.5 inline-flex items-center gap-1 text-xs font-semibold",
                  supervisor.status === "active"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {supervisor.status === "active" ? (
                  <>
                    <CheckCircle2 size={13} />
                    مفعّل
                  </>
                ) : (
                  <>
                    <Clock3 size={13} />
                    بانتظار تأكيد المشرف من بريده
                  </>
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 size={15} />
            إزالة
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <label
            htmlFor="supervisor-email"
            className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
          >
            بريد المشرف
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="supervisor-email"
              type="email"
              inputMode="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="mentor@example.com"
              className={cn(
                "flex-1 rounded-xl border bg-white px-4 py-3 text-left placeholder:text-zinc-400 dark:bg-zinc-950/40",
                emailError
                  ? "border-red-400 dark:border-red-800"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || email.trim().length === 0}
              className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              إضافة مشرف
            </button>
          </div>

          {emailError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              أدخل بريدًا إلكترونيًا صحيحًا
            </p>
          )}
        </div>
      )}

      {confirmingRemove && (
        <ConfirmDialog
          title="إزالة المشرف؟"
          message={
            supervisor?.status === "active"
              ? "المشرف مفعّل حاليًا — إزالته ستُرسل إشعارًا إلى بريده. هل تريد المتابعة؟"
              : "لم يؤكد المشرف دعوته بعد، ويمكنك إزالتها الآن دون موافقته."
          }
          confirmLabel="إزالة"
          cancelLabel="تراجع"
          onConfirm={() => {
            removeSupervisor();
            setConfirmingRemove(false);
          }}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}
    </section>
  );
};
