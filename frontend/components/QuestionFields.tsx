"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ImageIcon, Music, Plus, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { QUESTION_CATEGORIES, type QuestionCategoryValue } from "@/app/constants/question.constants";
import {
  MIN_OPTIONS,
  type QuestionDraft,
  type QuestionDraftErrors,
} from "@/app/lib/question-draft";

export const questionInputClass =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";
const inputClass = questionInputClass;
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const hintClass = "mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400";
const errorClass = "mt-1 block text-xs font-normal text-red-600 dark:text-red-400";

const Required = () => <span className="text-red-500"> *</span>;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
    <legend className="px-2 text-sm font-bold text-blue-700 dark:text-blue-400">{title}</legend>
    {children}
  </fieldset>
);

// A data: URL for previewing an image File. Read asynchronously, and only
// returned while it still belongs to the current file.
export function useImagePreview(file: File | null) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") setPreview({ file, url: reader.result });
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file]);
  return file && preview?.file === file ? preview.url : null;
}

// Optional single-file picker (image / audio). Shows the chosen file — with
// a thumbnail for images — and lets the student replace or clear it.
const FilePicker = ({
  label,
  accept,
  icon,
  file,
  preview,
  onChange,
}: {
  label: string;
  accept: string;
  icon: ReactNode;
  file: File | null;
  preview?: boolean;
  onChange: (file: File | null) => void;
}) => {
  const url = useImagePreview(preview ? file : null);

  return (
    <div className={labelClass}>
      {label}
      {file ? (
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
            <img src={url} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
          ) : (
            icon
          )}
          <span className="flex-1 truncate font-normal" dir="auto">{file.name}</span>
          <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            تغيير
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(event) => event.target.files?.[0] && onChange(event.target.files[0])}
            />
          </label>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`إزالة ${label}`}
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-sm font-normal text-zinc-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400">
          {icon}
          اختر ملفًا
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
};

interface QuestionFieldsProps {
  draft: QuestionDraft;
  onChange: (patch: Partial<QuestionDraft>) => void;
  errors: QuestionDraftErrors;
  showErrors: boolean;
  // Keeps radio groups apart when several forms are on one page.
  idPrefix: string;
}

// Every field of a question: the information row, its MCQ card, and the
// optional fill-in-the-blank card. Controlled — the parent owns the draft.
export const QuestionFields = ({
  draft,
  onChange,
  errors,
  showErrors,
  idPrefix,
}: QuestionFieldsProps) => {
  const showError = (message?: string) =>
    showErrors && message ? <span className={errorClass}>{message}</span> : null;

  const removeOption = (index: number) => {
    const { correctIndex } = draft;
    onChange({
      options: draft.options.filter((_, i) => i !== index),
      correctIndex:
        correctIndex === null || correctIndex === index
          ? null
          : correctIndex > index
            ? correctIndex - 1
            : correctIndex,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="المعلومة">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            الفئة
            <select
              value={draft.category}
              onChange={(event) => onChange({ category: event.target.value as QuestionCategoryValue })}
              className={cn(inputClass, "cursor-pointer")}
            >
              {QUESTION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            العنوان (اختياري)
            <input
              dir="auto"
              value={draft.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <label className={labelClass}>
          الوصف<Required />
          <textarea
            dir="auto"
            rows={2}
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
            className={cn(inputClass, "resize-y")}
          />
          <span className={hintClass}>يظهر عند الضغط على السؤال في صفحة الأسئلة.</span>
          {showError(errors.description)}
        </label>

        <label className={labelClass}>
          الشرح<Required />
          <textarea
            dir="auto"
            rows={3}
            value={draft.explanation}
            onChange={(event) => onChange({ explanation: event.target.value })}
            className={cn(inputClass, "resize-y")}
          />
          <span className={hintClass}>
            شرح تفصيلي يساعد على فهم الفكرة وراء السؤال، ويُستخدم أثناء جلسة الاختبار.
          </span>
          {showError(errors.explanation)}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <FilePicker
            label="صورة (اختياري)"
            accept="image/*"
            icon={<ImageIcon className="size-4 shrink-0" />}
            file={draft.image}
            preview
            onChange={(image) => onChange({ image })}
          />
          <FilePicker
            label="مقطع صوتي (اختياري)"
            accept="audio/*"
            icon={<Music className="size-4 shrink-0" />}
            file={draft.audio}
            onChange={(audio) => onChange({ audio })}
          />
        </div>
      </Section>

      <Section title="سؤال الاختيار من متعدد">
        <label className={labelClass}>
          نص السؤال<Required />
          <textarea
            dir="auto"
            rows={2}
            value={draft.mcqText}
            onChange={(event) => onChange({ mcqText: event.target.value })}
            className={cn(inputClass, "resize-y")}
          />
          {showError(errors.mcqText)}
        </label>

        <div className={labelClass}>
          الخيارات<Required />
          <span className={hintClass}>اضغط على الدائرة بجانب الإجابة الصحيحة.</span>
          <div className="mt-2 flex flex-col gap-2">
            {draft.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`${idPrefix}-correct-answer`}
                  checked={draft.correctIndex === index}
                  onChange={() => onChange({ correctIndex: index })}
                  disabled={!option.trim()}
                  aria-label={`الخيار ${index + 1} هو الإجابة الصحيحة`}
                  className="size-4 shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                />
                <input
                  dir="auto"
                  value={option}
                  onChange={(event) =>
                    onChange({
                      options: draft.options.map((o, i) => (i === index ? event.target.value : o)),
                    })
                  }
                  placeholder={`الخيار ${index + 1}`}
                  className={cn(
                    inputClass,
                    "mt-0",
                    draft.correctIndex === index &&
                      "border-emerald-400 bg-emerald-50/60 dark:border-emerald-600 dark:bg-emerald-950/30"
                  )}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={draft.options.length <= MIN_OPTIONS}
                  aria-label={`حذف الخيار ${index + 1}`}
                  className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 disabled:invisible dark:hover:bg-zinc-800"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange({ options: [...draft.options, ""] })}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Plus className="size-4" />
            إضافة خيار
          </button>
          {showError(errors.options)}
        </div>
      </Section>

      {/* Optional fill-in-the-blank card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onChange({ withFib: !draft.withFib })}
          aria-expanded={draft.withFib}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300"
        >
          <span>
            إضافة سؤال أكمل الفراغ أيضًا
            <span className="ms-1 font-normal text-zinc-500 dark:text-zinc-400">(اختياري)</span>
          </span>
          <ChevronDown className={cn("size-4 transition-transform", draft.withFib && "rotate-180")} />
        </button>

        {draft.withFib && (
          <div className="flex flex-col gap-4 border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800">
            <label className={labelClass}>
              نص السؤال<Required />
              <textarea
                dir="auto"
                rows={2}
                value={draft.fibText}
                onChange={(event) => onChange({ fibText: event.target.value })}
                placeholder="مثال: عاصمة مصر هي ______"
                className={cn(inputClass, "resize-y")}
              />
              {showError(errors.fibText)}
            </label>

            <div className={labelClass}>
              الإجابات المقبولة<Required />
              <span className={hintClass}>أضف كل صيغة صحيحة للإجابة.</span>
              <div className="mt-2 flex flex-col gap-2">
                {draft.correctTexts.map((text, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      dir="auto"
                      value={text}
                      onChange={(event) =>
                        onChange({
                          correctTexts: draft.correctTexts.map((t, i) =>
                            i === index ? event.target.value : t
                          ),
                        })
                      }
                      placeholder={`الإجابة ${index + 1}`}
                      className={cn(inputClass, "mt-0")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ correctTexts: draft.correctTexts.filter((_, i) => i !== index) })
                      }
                      disabled={draft.correctTexts.length <= 1}
                      aria-label={`حذف الإجابة ${index + 1}`}
                      className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 disabled:invisible dark:hover:bg-zinc-800"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onChange({ correctTexts: [...draft.correctTexts, ""] })}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Plus className="size-4" />
                إضافة صيغة أخرى
              </button>
              {showError(errors.correctTexts)}
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={draft.caseSensitive}
                onChange={(event) => onChange({ caseSensitive: event.target.checked })}
                className="accent-blue-600"
              />
              مطابقة حالة الأحرف (للإجابات باللغة الإنجليزية)
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
