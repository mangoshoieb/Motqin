"use client";

import { useState, type ReactElement } from "react";
import { cn } from "@/app/lib/utils";
import { ABSENT } from "@/app/constants/tracking-table.constants";
import {
  GridField,
  fieldType,
  normalizeDigits,
  opLabel,
  opNeedsValue,
  opsForType,
} from "@/app/lib/tracking-table";
import { CellValue, FilterOp, RowFilter } from "@/app/types/tracking-table.types";
import { Popover, Segmented, inputClass, primaryButton } from "../ui";
import { choiceChipClass } from "./Cell";

// "Show only students where <field> <op> <value>". One condition per chip;
// the server ANDs them together.
export function FilterPopover({
  fields,
  trigger,
  onAdd,
}: {
  fields: GridField[];
  trigger: ReactElement;
  onAdd: (filter: RowFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fieldId, setFieldId] = useState(fields[0]?.id ?? "name");
  const field = fields.find((f) => f.id === fieldId) ?? fields[0];
  const type = field ? fieldType(field) : "Text";
  const ops = opsForType(type);
  const [op, setOp] = useState<FilterOp>(ops[0]);
  const [text, setText] = useState("");
  const [flag, setFlag] = useState<"true" | "false">("true");
  const [picked, setPicked] = useState<string[]>([]);
  const [absent, setAbsent] = useState(false);

  const options = field?.kind === "column" ? field.column.options ?? [] : [];

  const changeField = (id: string) => {
    const next = fields.find((f) => f.id === id);
    setFieldId(id);
    setOp(opsForType(next ? fieldType(next) : "Text")[0]);
    setText("");
    setPicked([]);
    setAbsent(false);
  };

  const value = (): CellValue | CellValue[] | undefined => {
    if (!opNeedsValue(op)) return undefined;
    if (type === "YesNo") return flag === "true";
    if (type === "Choice") return op === "in" ? picked : picked[0];
    if (type === "Exam" && absent) return ABSENT;
    if (type === "Number" || type === "Exam") {
      const n = Number(normalizeDigits(text.trim()));
      return text.trim() && Number.isFinite(n) ? n : undefined;
    }
    return text.trim() ? normalizeDigits(text.trim()) : undefined;
  };

  const v = value();
  const ready = !opNeedsValue(op) || (Array.isArray(v) ? v.length > 0 : v !== undefined);

  const apply = () => {
    if (!field || !ready) return;
    onAdd({ field: field.id, op, ...(opNeedsValue(op) ? { value: v } : {}) });
    setOpen(false);
    setText("");
    setPicked([]);
    setAbsent(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} trigger={trigger} className="w-72 p-3">
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold text-zinc-500">عرض الطلاب حيث</p>
        <select value={fieldId} onChange={(e) => changeField(e.target.value)} className={cn(inputClass, "py-2")}>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select value={op} onChange={(e) => setOp(e.target.value as FilterOp)} className={cn(inputClass, "py-2")}>
          {ops.map((o) => (
            <option key={o} value={o}>
              {opLabel(o, type)}
            </option>
          ))}
        </select>

        {opNeedsValue(op) &&
          (type === "YesNo" ? (
            <Segmented
              value={flag}
              onChange={setFlag}
              options={[
                { value: "true", label: "نعم" },
                { value: "false", label: "لا" },
              ]}
            />
          ) : type === "Choice" ? (
            <div className="flex flex-wrap gap-1.5">
              {options.map((option) => {
                const on = picked.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setPicked((prev) =>
                        op === "in" ? (on ? prev.filter((p) => p !== option) : [...prev, option]) : [option],
                      )
                    }
                    className={cn(
                      "rounded-lg px-2 py-1 text-xs font-bold transition",
                      choiceChipClass(options, option),
                      on ? "ring-2 ring-blue-500" : "opacity-60 hover:opacity-100",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type={type === "Date" ? "date" : "text"}
                inputMode={type === "Number" || type === "Exam" ? "decimal" : undefined}
                dir={type === "Text" ? "auto" : "ltr"}
                disabled={absent}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="القيمة"
                className={cn(inputClass, "py-2 disabled:opacity-40")}
              />
              {type === "Exam" && (op === "eq" || op === "neq") && (
                <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" checked={absent} onChange={(e) => setAbsent(e.target.checked)} />
                  غائب
                </label>
              )}
            </div>
          ))}

        <button type="button" onClick={apply} disabled={!ready} className={cn(primaryButton, "py-2")}>
          تطبيق
        </button>
      </div>
    </Popover>
  );
}
