"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import {
  ABSENT,
  CHOICE_CHIP_COLORS,
  TRACKING_LIMITS,
} from "@/app/constants/tracking-table.constants";
import {
  GridField,
  SCORE_TONE_CLASSES,
  asNumber,
  fieldType,
  formatDate,
  formatNumber,
  isAbsent,
  isEmptyValue,
  normalizeDigits,
  rowValue,
  scoreTone,
  toDateInput,
} from "@/app/lib/tracking-table";
import { CellValue, TrackingRow } from "@/app/types/tracking-table.types";
import { Popover } from "../ui";

type EditableType = "Text" | "Phone" | "Number" | "Exam" | "Date";

// One grid cell: shows the value the way its type reads best, and edits in
// place. Yes/No and choice cells change with a click; the rest open a
// small editor (Enter or leaving the cell saves, Esc cancels).
export function Cell({
  row,
  field,
  onSave,
  readOnly = false,
}: {
  row: TrackingRow;
  field: GridField;
  onSave: (value: CellValue) => void;
  // An assistant without EditRows sees the value and can't change it.
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const type = fieldType(field);
  const value = rowValue(row, field);
  const column = field.kind === "column" ? field.column : null;

  if (readOnly && (type === "YesNo" || type === "Choice")) {
    // Same look, no clicks or keyboard focus.
    return (
      <span inert className="contents">
        {type === "YesNo" ? (
          <YesNoCell value={value} onChange={onSave} />
        ) : (
          <ChoiceCell value={value} options={column?.options ?? []} onChange={onSave} />
        )}
      </span>
    );
  }
  if (type === "YesNo") return <YesNoCell value={value} onChange={onSave} />;
  if (type === "Choice")
    return <ChoiceCell value={value} options={column?.options ?? []} onChange={onSave} />;

  if (readOnly) {
    return (
      <div className="flex h-full min-h-7 w-full items-center">
        <CellDisplay type={type} value={value} maxScore={column?.maxScore ?? null} />
      </div>
    );
  }

  const isName = field.kind === "core" && field.id === "name";

  if (editing) {
    return (
      <InlineEditor
        type={type}
        initial={value}
        maxScore={column?.maxScore ?? null}
        // A name can't be cleared, except on an imported row that never had one.
        required={isName && !isEmptyValue(value)}
        maxLength={isName ? TRACKING_LIMITS.STUDENT_NAME : type === "Text" ? TRACKING_LIMITS.TEXT_VALUE : undefined}
        onCancel={() => setEditing(false)}
        onCommit={(next) => {
          setEditing(false);
          if (String(next ?? "") !== String(value ?? "")) onSave(next);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex h-full min-h-7 w-full items-center rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <CellDisplay type={type} value={value} maxScore={column?.maxScore ?? null} />
    </button>
  );
}

function CellDisplay({
  type,
  value,
  maxScore,
}: {
  type: EditableType;
  value: CellValue;
  maxScore: number | null;
}) {
  if (isEmptyValue(value)) return <span className="text-zinc-300 dark:text-zinc-700">—</span>;

  switch (type) {
    case "Phone":
      return (
        <span dir="ltr" className="tabular-nums text-zinc-700 dark:text-zinc-300">
          {String(value)}
        </span>
      );
    case "Number":
      return <span className="tabular-nums">{formatNumber(asNumber(value) ?? 0)}</span>;
    case "Date":
      return <span>{formatDate(value)}</span>;
    case "Exam": {
      if (isAbsent(value)) {
        return (
          <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            غائب
          </span>
        );
      }
      const score = asNumber(value) ?? 0;
      const tone = scoreTone(score, maxScore);
      return (
        <span
          className={cn(
            "rounded-md px-2 py-0.5 font-semibold tabular-nums",
            tone ? SCORE_TONE_CLASSES[tone] : "bg-zinc-100 dark:bg-zinc-800",
          )}
        >
          {formatNumber(score)}
          {maxScore ? <span className="font-normal opacity-60"> / {formatNumber(maxScore)}</span> : null}
        </span>
      );
    }
    default:
      return <span className="truncate">{String(value)}</span>;
  }
}

function InlineEditor({
  type,
  initial,
  maxScore,
  required,
  maxLength,
  onCommit,
  onCancel,
}: {
  type: EditableType;
  initial: CellValue;
  maxScore: number | null;
  required: boolean;
  maxLength?: number;
  onCommit: (value: CellValue) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() =>
    type === "Date" ? toDateInput(initial) : isAbsent(initial) || isEmptyValue(initial) ? "" : String(initial),
  );
  // Enter saves and unmounts the input; the blur that may follow must not
  // save a second time.
  const done = useRef(false);

  const finish = (value: CellValue | undefined) => {
    if (done.current) return;
    done.current = true;
    if (value === undefined) onCancel();
    else onCommit(value);
  };

  // Shown under the input; Enter on a bad value keeps the editor open.
  const [error, setError] = useState<string | null>(null);
  // Where the message goes: it renders in a portal, since the next row's
  // sticky name cell would paint over anything inside this one.
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorAt, setErrorAt] = useState<{ top: number; right: number } | null>(null);
  const showError = (message: string) => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) setErrorAt({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setError(message);
  };

  const parse = (): { value: CellValue } | { error: string } => {
    const text = draft.trim();
    if (text === "") return required ? { error: "اسم الطالب مطلوب" } : { value: null };
    if (type === "Number" || type === "Exam") {
      const n = Number(normalizeDigits(text));
      if (!Number.isFinite(n)) return { error: "اكتب رقمًا" };
      if (type === "Exam" && maxScore && (n < 0 || n > maxScore)) {
        return { error: `الدرجة من 0 إلى ${formatNumber(maxScore)}` };
      }
      return { value: n };
    }
    if (type === "Phone") return { value: normalizeDigits(text) };
    return { value: text };
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const result = parse();
      if ("error" in result) showError(result.error);
      else finish(result.value);
    } else if (event.key === "Escape") {
      finish(undefined);
    }
  };

  // Leaving the cell with a bad value keeps the old one.
  const onBlur = () => {
    if (done.current) return;
    const result = parse();
    if ("error" in result) {
      toast.error(result.error);
      finish(undefined);
    } else {
      finish(result.value);
    }
  };

  const numeric = type === "Number" || type === "Exam";

  return (
    <div className="relative flex items-center gap-1">
      <input
        ref={inputRef}
        autoFocus
        type={type === "Date" ? "date" : "text"}
        inputMode={numeric ? "decimal" : type === "Phone" ? "tel" : undefined}
        dir={numeric || type === "Phone" || type === "Date" ? "ltr" : "auto"}
        value={draft}
        maxLength={maxLength}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        aria-invalid={!!error}
        className="h-8 w-full min-w-0 rounded-md border border-blue-500 bg-white px-2 text-sm text-zinc-900 shadow-sm outline-none ring-2 ring-blue-500/20 dark:bg-zinc-950 dark:text-zinc-100"
      />
      {type === "Exam" && (
        <>
          {maxScore ? <span className="shrink-0 text-xs text-zinc-400">/ {formatNumber(maxScore)}</span> : null}
          <button
            type="button"
            // Keep focus in the input so its blur doesn't save first.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => finish(ABSENT)}
            className="shrink-0 rounded-md bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
          >
            غائب
          </button>
        </>
      )}
      {error &&
        errorAt &&
        createPortal(
          <span
            role="alert"
            dir="rtl"
            // Under the input, lined up with its start edge (the right in RTL).
            style={{ top: errorAt.top, right: errorAt.right }}
            className="fixed z-[60] whitespace-nowrap rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white shadow-md dark:bg-rose-700"
          >
            {error}
          </span>,
          document.body,
        )}
    </div>
  );
}

// Click cycles: empty → yes → no → empty.
function YesNoCell({ value, onChange }: { value: CellValue; onChange: (value: CellValue) => void }) {
  const next = value === true ? false : value === false ? null : true;
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title="اضغط للتغيير"
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition",
        value === true && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300",
        value === false && "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:hover:bg-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300",
        value !== true &&
          value !== false &&
          "border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 dark:border-zinc-700",
      )}
    >
      {value === true ? <Check size={14} /> : value === false ? <X size={14} /> : <Minus size={14} />}
      {value === true ? "نعم" : value === false ? "لا" : ""}
    </button>
  );
}

export const choiceChipClass = (options: string[], value: string) =>
  CHOICE_CHIP_COLORS[Math.max(0, options.indexOf(value)) % CHOICE_CHIP_COLORS.length];

function ChoiceCell({
  value,
  options,
  onChange,
}: {
  value: CellValue;
  options: string[];
  onChange: (value: CellValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const pick = (next: CellValue) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="min-w-44"
      trigger={
        <button type="button" className="flex h-full min-h-7 w-full items-center rounded-md text-start outline-none">
          {isEmptyValue(value) ? (
            <span className="text-zinc-300 dark:text-zinc-700">—</span>
          ) : (
            <span
              className={cn(
                "truncate rounded-md px-2 py-0.5 text-xs font-bold",
                choiceChipClass(options, String(value)),
              )}
            >
              {String(value)}
            </span>
          )}
        </button>
      }
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => pick(option)}
          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", choiceChipClass(options, option))}>
            {option}
          </span>
          {option === value && <Check size={14} className="ms-auto text-blue-600 dark:text-blue-400" />}
        </button>
      ))}
      {!isEmptyValue(value) && (
        <>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full rounded-xl px-2.5 py-2 text-start text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            مسح الاختيار
          </button>
        </>
      )}
    </Popover>
  );
}
