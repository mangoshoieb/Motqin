"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountries } from "@/app/hooks/useLookups";
import { EGYPT_DIAL_CODE, PhoneValue } from "@/app/lib/phone";
import { cn } from "@/app/lib/utils";

// 🇪🇬 from "EG". Windows shows the two letters instead, which reads fine.
const flagOf = (code?: string | null) =>
  code && /^[A-Za-z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "";

interface PhoneFieldProps {
  label?: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * A mobile number with its country code. The codes come from
 * GET /lookups/countries (dialCode), in the order the server sends them —
 * Egypt first. Turn the value into what the API takes with
 * toInternationalPhone (app/lib/phone.ts).
 */
export default function PhoneField({
  label = "رقم الهاتف",
  value,
  onChange,
  error,
  disabled,
  autoFocus,
}: PhoneFieldProps) {
  const { data: countries } = useCountries();
  // Several countries share +1 (and the list may grow), so the picker keys
  // on the country while the value keeps only its code.
  const withCodes = (countries ?? []).filter((c) => typeof c.dialCode === "number" && c.dialCode > 0);
  const selected =
    withCodes.find((c) => c.dialCode === value.dialCode && c.value === value.countryValue) ??
    withCodes.find((c) => c.dialCode === value.dialCode);

  const isEgypt = value.dialCode === EGYPT_DIAL_CODE;
  const inputId = useId();

  return (
    <div className="w-full space-y-1.5">
      {/* One outlined box, the label sitting on its top border: the dial
          code (opens the country list), a divider, then the number. */}
      <div
        className={cn(
          "relative mt-3 flex h-14 items-center rounded-2xl border bg-white transition dark:bg-zinc-900",
          error
            ? "border-red-400 dark:border-red-500/60"
            : "border-gray-300 focus-within:border-blue-600 dark:border-zinc-700 dark:focus-within:border-blue-500",
          disabled && "opacity-60",
        )}
      >
        <label
          htmlFor={inputId}
          className={cn(
            "absolute -top-2.5 right-4 bg-white px-1.5 text-xs font-semibold tracking-wide dark:bg-zinc-900",
            error ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-zinc-400",
          )}
        >
          {label}
        </label>

        <div dir="ltr" className="flex h-full w-full items-center">
          <Select
            value={selected ? String(selected.value) : ""}
            onValueChange={(next) => {
              const country = withCodes.find((c) => String(c.value) === next);
              if (country?.dialCode) onChange({ ...value, dialCode: country.dialCode, countryValue: country.value });
            }}
            disabled={disabled || !withCodes.length}
          >
            <SelectTrigger
              aria-label="رمز الدولة"
              title={selected ? selected.nameAr || selected.nameEn : undefined}
              className="h-full shrink-0 gap-1 rounded-none rounded-l-2xl border-0 bg-transparent pl-4 pr-2 text-base font-semibold text-gray-900 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 dark:bg-transparent dark:text-zinc-100"
            >
              <SelectValue>
                <span dir="ltr">+{value.dialCode}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              dir="rtl"
              side="bottom"
              align="start"
              alignItemWithTrigger={false}
              className="w-72 max-h-80 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              {withCodes.map((country) => (
                <SelectItem
                  key={country.value}
                  value={String(country.value)}
                  className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-blue-50 dark:focus:bg-blue-500/10"
                >
                  <span className="flex w-full items-center gap-2">
                    <span>{flagOf(country.code)}</span>
                    <span className="flex-1 text-right">{country.nameAr || country.nameEn}</span>
                    <span dir="ltr" className="text-xs text-gray-500 dark:text-zinc-400">
                      +{country.dialCode}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span aria-hidden className="h-7 w-px shrink-0 bg-gray-300 dark:bg-zinc-700" />

          <input
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            autoFocus={autoFocus}
            disabled={disabled}
            placeholder={isEgypt ? "01XXXXXXXXX" : "رقم الموبايل"}
            value={value.number}
            onChange={(event) => onChange({ ...value, number: event.target.value })}
            aria-invalid={!!error}
            className="h-full min-w-0 flex-1 rounded-r-2xl bg-transparent px-3 text-base text-gray-900 outline-none placeholder:text-gray-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
