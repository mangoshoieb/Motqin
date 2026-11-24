"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountries } from "@/app/hooks/useLookups";
import { findLookupItem } from "@/app/types/lookup.types";

interface CountrySelectProps {
  value: number | null;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

// الدولة, from GET /lookups/countries in the order it arrives (Egypt, the
// United States, then the rest by Arabic name). Sends the country's value.
export default function CountrySelect({ value, onChange, error, disabled }: CountrySelectProps) {
  const { data: countries, isPending, isError } = useCountries();
  const selected = findLookupItem(countries, value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-600 dark:text-zinc-400">الدولة</label>
      <Select
        value={selected ? String(selected.value) : ""}
        onValueChange={(next) => onChange(Number(next))}
        disabled={disabled || isPending || isError}
      >
        <SelectTrigger className="h-12 w-full rounded-xl border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-right text-base shadow-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/30 data-[placeholder]:text-gray-400">
          <SelectValue
            placeholder={isPending ? "جاري تحميل الدول..." : isError ? "تعذر تحميل الدول" : "اختر الدولة"}
          >
            {selected ? selected.nameAr || selected.nameEn : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          dir="rtl"
          side="bottom"
          align="start"
          alignItemWithTrigger={false}
          className="max-h-80 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          {countries?.map((country) => (
            <SelectItem
              key={country.value}
              value={String(country.value)}
              className="cursor-pointer rounded-lg text-right py-2.5 px-3 focus:bg-blue-50 dark:focus:bg-blue-500/10"
            >
              {country.nameAr || country.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
