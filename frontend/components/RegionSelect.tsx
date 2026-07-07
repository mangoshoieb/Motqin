"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EGYPTIAN_GOVERNORATES } from "@/app/constants/governorates.constants";

interface RegionSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function RegionSelect({
  value,
  onChange,
  error,
}: RegionSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">المحافظة</label>

      <Select
        value={value ?? ""}
        onValueChange={(value) => onChange(value ?? "")}
      >
        <SelectTrigger className=" h-12 w-full rounded-xl border-gray-300 bg-white px-4 text-right text-base shadow-none transition-all  hover:border-blue-400  focus:border-blue-500  focus:ring-2  focus:ring-blue-100  data-[placeholder]:text-gray-400">
          <SelectValue placeholder="اختر المحافظة" />
        </SelectTrigger>

        <SelectContent
          dir="rtl"
          side="bottom"
          align="start"
          sideOffset={8}
          className=" rounded-2xl border  border-gray-200  bg-white/90 shadow-xl overflow-hidden z-50     data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 "
        >
          {EGYPTIAN_GOVERNORATES.map((gov) => (
            <SelectItem
              key={gov}
              value={gov}
              className=" cursor-pointer rounded-lg text-right py-3 px-3 transition-colors  focus:bg-blue-50  focus:text-blue-700  data-[state=checked]:bg-blue-100 data-[state=checked]:font-semibold"
            >
              {gov}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
