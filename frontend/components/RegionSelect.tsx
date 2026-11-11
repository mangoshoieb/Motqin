"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEgyptianGovernorates } from "@/app/hooks/useLookups";
import { findLookupItem } from "@/app/types/lookup.types";

interface RegionSelectProps {
  // The governorate the user is on. The API takes an integer, but what the
  // backend reports on the user is the enum name ("Cairo"), so both resolve.
  value?: number | string | null;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * The 27 Egyptian governorates, from GET /lookups/egyptian-governorates —
 * the list the backend's own EgyptianGovernorate enum is built from, so the
 * number this sends back is always one it accepts.
 */
export default function RegionSelect({
  value,
  onChange,
  error,
  disabled,
}: RegionSelectProps) {
  const { data: governorates, isPending, isError } = useEgyptianGovernorates();

  const selected = findLookupItem(governorates, value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">المحافظة</label>

      <Select
        value={selected ? String(selected.value) : ""}
        onValueChange={(next) => onChange(Number(next))}
        disabled={disabled || isPending || isError}
      >
        <SelectTrigger className=" h-12 w-full rounded-xl border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-right text-base shadow-none transition-all  hover:border-blue-400  focus:border-blue-500  focus:ring-2  focus:ring-blue-100 dark:focus:ring-blue-500/30  data-[placeholder]:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50">
          {/* The label is passed in rather than left to the trigger: the
              items only exist while the list is open, so a value restored
              from the user's profile would otherwise show as its number. */}
          <SelectValue
            placeholder={
              isPending ? "جاري تحميل المحافظات..." : isError ? "تعذر تحميل المحافظات" : "اختر المحافظة"
            }
          >
            {selected ? selected.nameAr || selected.nameEn : null}
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          dir="rtl"
          side="bottom"
          align="start"
          sideOffset={8}
          className=" rounded-2xl border  border-gray-200 dark:border-zinc-800  bg-white/90 dark:bg-zinc-900/95 shadow-xl overflow-hidden z-50     data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 "
        >
          {governorates?.map((governorate) => (
            <SelectItem
              key={governorate.value}
              value={String(governorate.value)}
              className=" cursor-pointer rounded-lg text-right py-3 px-3 transition-colors  focus:bg-blue-50 dark:focus:bg-blue-500/10  focus:text-blue-700 dark:focus:text-blue-300 data-[state=checked]:bg-blue-100 dark:data-[state=checked]:bg-blue-500/15 data-[state=checked]:font-semibold"
            >
              {governorate.nameAr || governorate.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
