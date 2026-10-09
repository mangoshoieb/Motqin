"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, ImageIcon, Music, Plus, X } from "lucide-react";
import { useAddUserQuestion } from "@/app/hooks/useAddQuestion";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { cn } from "@/app/lib/utils";
import {
  QUESTION_CATEGORIES,
  type QuestionCategoryValue,
} from "@/app/constants/question.constants";

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const hintClass = "mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400";
const errorClass = "mt-1 block text-xs font-normal text-red-600 dark:text-red-400";

const MIN_OPTIONS = 2;

const Required = () => <span className="text-red-500"> *</span>;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
    <legend className="px-2 text-sm font-bold text-blue-700 dark:text-blue-400">{title}</legend>
    {children}
  </fieldset>
);

// Optional single-file picker (image / audio) that shows the chosen file's
// name with a way to clear it.
const FilePicker = ({
  label,
  accept,
  icon,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  icon: ReactNode;
  file: File | null;
  onChange: (file: File | null) => void;
}) => (
  <div className={labelClass}>
    {label}
    {file ? (
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
        {icon}
        <span className="flex-1 truncate font-normal" dir="auto">{file.name}</span>
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

interface AddQuestionDialogProps {
  lessonId: number;
  // The tab the student is on — the category field starts there.
  defaultCategory: QuestionCategoryValue;
  // Appended after the lesson's existing questions.
  displayOrder: number;
  onCreated: (category: QuestionCategoryValue) => void;
  onCancel: () => void;
}

// Popup for POST /questions/add-user-question: one information row (title,
// description, explanation, optional media) with its MCQ card, and an
// optional fill-in-the-blank card behind a toggle.
export const AddQuestionDialog = ({
  lessonId,
  defaultCategory,
  displayOrder,
  onCreated,
  onCancel,
}: AddQuestionDialogProps) => {
  const addQuestion = useAddUserQuestion(String(lessonId));

  const [category, setCategory] = useState<QuestionCategoryValue>(defaultCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [explanation, setExplanation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);

  const [mcqText, setMcqText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  const [withFib, setWithFib] = useState(false);
  const [fibText, setFibText] = useState("");
  const [correctTexts, setCorrectTexts] = useState<string[]>([""]);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Errors only show once the student has tried to submit.
  const [submitted, setSubmitted] = useState(false);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const hasDuplicateOptions = new Set(filledOptions).size !== filledOptions.length;
  const correctAnswer = correctIndex !== null ? options[correctIndex]?.trim() : "";
  const filledCorrectTexts = correctTexts.map((t) => t.trim()).filter(Boolean);

  const errors = {
    description: !description.trim() && "الوصف مطلوب.",
    explanation: !explanation.trim() && "الشرح مطلوب.",
    mcqText: !mcqText.trim() && "نص السؤال مطلوب.",
    options:
      (filledOptions.length < MIN_OPTIONS && "أضف خيارين على الأقل.") ||
      (hasDuplicateOptions && "لا يمكن تكرار نفس الخيار.") ||
      (!correctAnswer && "اختر الإجابة الصحيحة بالضغط على الدائرة بجانبها."),
    fibText: withFib && !fibText.trim() && "نص سؤال أكمل الفراغ مطلوب.",
    correctTexts: withFib && filledCorrectTexts.length === 0 && "أضف إجابة مقبولة واحدة على الأقل.",
  };
  const isValid = !Object.values(errors).some(Boolean);
  const showError = (message: string | false) =>
    submitted && message ? <span className={errorClass}>{message}</span> : null;

  const updateOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) =>
      prev === null || prev === index ? null : prev > index ? prev - 1 : prev
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid || addQuestion.isPending) return;

    addQuestion.mutate(
      {
        lessonID: lessonId,
        questionCategory: category,
        displayOrder,
        title: title.trim() || undefined,
        description: description.trim(),
        explanation: explanation.trim(),
        image,
        audio,
        mcqText: mcqText.trim(),
        answerOptions: filledOptions,
        correctAnswer,
        ...(withFib && {
          fibText: fibText.trim(),
          correctText: filledCorrectTexts,
          caseSensitive,
        }),
      },
      {
        onSuccess: () => {
          toast.success("تمت إضافة السؤال");
          onCreated(category);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <form
        dir="rtl"
        noValidate
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">إضافة سؤال</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق"
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <Section title="المعلومة">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                الفئة
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as QuestionCategoryValue)}
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
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className={labelClass}>
              الوصف<Required />
              <textarea
                dir="auto"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
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
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
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
                file={image}
                onChange={setImage}
              />
              <FilePicker
                label="مقطع صوتي (اختياري)"
                accept="audio/*"
                icon={<Music className="size-4 shrink-0" />}
                file={audio}
                onChange={setAudio}
              />
            </div>
          </Section>

          <Section title="سؤال الاختيار من متعدد">
            <label className={labelClass}>
              نص السؤال<Required />
              <textarea
                dir="auto"
                rows={2}
                value={mcqText}
                onChange={(event) => setMcqText(event.target.value)}
                className={cn(inputClass, "resize-y")}
              />
              {showError(errors.mcqText)}
            </label>

            <div className={labelClass}>
              الخيارات<Required />
              <span className={hintClass}>اضغط على الدائرة بجانب الإجابة الصحيحة.</span>
              <div className="mt-2 flex flex-col gap-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={correctIndex === index}
                      onChange={() => setCorrectIndex(index)}
                      disabled={!option.trim()}
                      aria-label={`الخيار ${index + 1} هو الإجابة الصحيحة`}
                      className="size-4 shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                    />
                    <input
                      dir="auto"
                      value={option}
                      onChange={(event) => updateOption(index, event.target.value)}
                      placeholder={`الخيار ${index + 1}`}
                      className={cn(
                        inputClass,
                        "mt-0",
                        correctIndex === index &&
                          "border-emerald-400 bg-emerald-50/60 dark:border-emerald-600 dark:bg-emerald-950/30"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= MIN_OPTIONS}
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
                onClick={() => setOptions((prev) => [...prev, ""])}
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
              onClick={() => setWithFib((prev) => !prev)}
              aria-expanded={withFib}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300"
            >
              <span>
                إضافة سؤال أكمل الفراغ أيضًا
                <span className="ms-1 font-normal text-zinc-500 dark:text-zinc-400">(اختياري)</span>
              </span>
              <ChevronDown
                className={cn("size-4 transition-transform", withFib && "rotate-180")}
              />
            </button>

            {withFib && (
              <div className="flex flex-col gap-4 border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800">
                <label className={labelClass}>
                  نص السؤال<Required />
                  <textarea
                    dir="auto"
                    rows={2}
                    value={fibText}
                    onChange={(event) => setFibText(event.target.value)}
                    placeholder="مثال: عاصمة مصر هي ______"
                    className={cn(inputClass, "resize-y")}
                  />
                  {showError(errors.fibText)}
                </label>

                <div className={labelClass}>
                  الإجابات المقبولة<Required />
                  <span className={hintClass}>أضف كل صيغة صحيحة للإجابة.</span>
                  <div className="mt-2 flex flex-col gap-2">
                    {correctTexts.map((text, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          dir="auto"
                          value={text}
                          onChange={(event) =>
                            setCorrectTexts((prev) =>
                              prev.map((t, i) => (i === index ? event.target.value : t))
                            )
                          }
                          placeholder={`الإجابة ${index + 1}`}
                          className={cn(inputClass, "mt-0")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCorrectTexts((prev) => prev.filter((_, i) => i !== index))
                          }
                          disabled={correctTexts.length <= 1}
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
                    onClick={() => setCorrectTexts((prev) => [...prev, ""])}
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
                    checked={caseSensitive}
                    onChange={(event) => setCaseSensitive(event.target.checked)}
                    className="accent-blue-600"
                  />
                  مطابقة حالة الأحرف (للإجابات باللغة الإنجليزية)
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-zinc-200 px-5 py-2.5 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={addQuestion.isPending}
            className="flex-1 rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addQuestion.isPending ? "جاري الإضافة..." : "إضافة السؤال"}
          </button>
        </div>
      </form>
    </div>
  );
};
