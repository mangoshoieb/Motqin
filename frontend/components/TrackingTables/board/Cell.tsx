"use client";

import { useRef, useState, type KeyboardEvent } from "react";
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
}: {
  row: TrackingRow;
  field: GridField;
  onSave: (value: CellValue) => void;
}) {
  const [editing, setEditing] = useState(false);
  const type = fieldType(field);
  const value = rowValue(row, field);
  const column = field.kind === "column" ? field.column : null;

  if (type === "YesNo") return <YesNoCell value={value} onChange={onSave} />;
  if (type === "Choice")
    return <ChoiceCell value={value} options={column?.options ?? []} onChange={onSave} />;

  if (editing) {
    return (
      <InlineEditor
        type={type}
        initial={value}
        maxScore={column?.maxScore ?? null}
        required={field.kind === "core" && field.id === "name"}
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
  onCommit,
  onCancel,
}: {
  type: EditableType;
  initial: CellValue;
  maxScore: number | null;
  required: boolean;
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

  const parse = (): CellValue | undefined => {
    const text = draft.trim();
    if (text === "") {
      if (required) {
        toast.error("اسم الطالب مطلوب");
        return undefined;
      }
      return null;
    }
    if (type === "Number" || type === "Exam") {
      const n = Number(normalizeDigits(text));
      if (!Number.isFinite(n)) {
        toast.error("اكتب رقمًا");
        return undefined;
      }
      if (type === "Exam" && maxScore && (n < 0 || n > maxScore)) {
        toast.error(`الدرجة من 0 إلى ${formatNumber(maxScore)}`);
        return undefined;
      }
      return n;
    }
    if (type === "Phone") return normalizeDigits(text);
    return text;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(parse());
    } else if (event.key === "Escape") {
      finish(undefined);
    }
  };

  const numeric = type === "Number" || type === "Exam";

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type={type === "Date" ? "date" : "text"}
        inputMode={numeric ? "decimal" : type === "Phone" ? "tel" : undefined}
        dir={numeric || type === "Phone" || type === "Date" ? "ltr" : "auto"}
        value={draft}
        maxLength={type === "Text" ? TRACKING_LIMITS.TEXT_VALUE : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => finish(parse())}
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
        value === true && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300",
        value === false && "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-300",
        value !== true &&
          value !== false &&
          "border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700",
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
          {option === value && <Check size={14} className="ms-auto text-blue-600" />}
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
