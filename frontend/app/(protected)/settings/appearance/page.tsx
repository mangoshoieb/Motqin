"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, Languages, Monitor, Moon, RotateCcw, Sun, Type, type LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { LANGUAGES, TEXT_SIZES } from "@/app/lib/appearance";
import { useAppearanceStore } from "@/app/lib/appearance.store";

type ThemeValue = "light" | "dark" | "system";

const THEMES: { value: ThemeValue; label: string; description: string; icon: LucideIcon }[] = [
  { value: "light", label: "فاتح", description: "خلفيات فاتحة ونص داكن", icon: Sun },
  { value: "dark", label: "داكن", description: "أريح للعين في الإضاءة الخافتة", icon: Moon },
  { value: "system", label: "مطابقة النظام", description: "يتبع إعداد جهازك تلقائيًا", icon: Monitor },
];

// The "أ" drawn on each text-size option, growing with the size.
const GLYPH_SIZE: Record<string, string> = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-2xl" };

const card = "rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900";

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <Icon size={20} />
      </span>
      <div>
        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

// A tiny drawing of the app in one theme: a top bar, a card and a button.
function ThemeSketch({ dark }: { dark: boolean }) {
  return (
    <div className={cn("flex h-full flex-col gap-1.5 p-2.5", dark ? "bg-zinc-950" : "bg-zinc-100")}>
      <div className={cn("h-2.5 rounded", dark ? "bg-zinc-800" : "bg-white")} />
      <div className={cn("flex flex-1 flex-col gap-1.5 rounded-md p-2", dark ? "bg-zinc-900" : "bg-white")}>
        <div className={cn("h-1.5 w-3/4 rounded-full", dark ? "bg-zinc-600" : "bg-zinc-300")} />
        <div className={cn("h-1.5 w-1/2 rounded-full", dark ? "bg-zinc-700" : "bg-zinc-200")} />
        <div className={cn("mt-auto h-3 w-10 rounded", dark ? "bg-blue-700" : "bg-blue-600")} />
      </div>
    </div>
  );
}

function ThemePreview({ value }: { value: ThemeValue }) {
  if (value !== "system") return <ThemeSketch dark={value === "dark"} />;
  // Half light, half dark, split down the middle.
  return (
    <div className="relative h-full">
      <ThemeSketch dark={false} />
      <div className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
        <ThemeSketch dark />
      </div>
    </div>
  );
}

const AppearanceSettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const textSize = useAppearanceStore((s) => s.textSize);
  const setTextSize = useAppearanceStore((s) => s.setTextSize);
  const language = useAppearanceStore((s) => s.language);
  const setLanguage = useAppearanceStore((s) => s.setLanguage);

  // next-themes and the persisted store only know the saved values in the
  // browser; render no selection on the server so nothing flips on hydrate.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">المظهر</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          تُطبَّق التغييرات فورًا وتُحفظ على هذا الجهاز.
        </p>
      </div>

      {/* Theme */}
      <section className={card}>
        <SectionHeader icon={Sun} title="السمة" description="اختر شكل الألوان في التطبيق." />
        <div role="radiogroup" aria-label="السمة" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {THEMES.map((item) => {
            const selected = mounted && theme === item.value;
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(item.value)}
                className={cn(
                  "group overflow-hidden rounded-2xl border-2 text-start transition",
                  selected
                    ? "border-blue-600 dark:border-blue-500"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                )}
              >
                <div className="h-28 border-b border-zinc-200 dark:border-zinc-800">
                  <ThemePreview value={item.value} />
                </div>
                <div className="flex items-start justify-between gap-2 p-3.5">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <Icon size={16} />
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                  </div>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                      selected
                        ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-700"
                        : "border-zinc-300 dark:border-zinc-600",
                    )}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Text size */}
      <section className={card}>
        <div className="flex items-start justify-between gap-4">
          <SectionHeader icon={Type} title="حجم الخط" description="يكبّر النصوص والمسافات في كل صفحات التطبيق." />
          {mounted && textSize !== "md" && (
            <button
              type="button"
              onClick={() => setTextSize("md")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <RotateCcw size={14} />
              الافتراضي
            </button>
          )}
        </div>

        <div
          role="radiogroup"
          aria-label="حجم الخط"
          className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1.5 sm:grid-cols-4 dark:bg-zinc-800/60"
        >
          {TEXT_SIZES.map((size) => {
            const selected = mounted && textSize === size.value;
            return (
              <button
                key={size.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTextSize(size.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 transition",
                  selected
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                )}
              >
                <span className={cn("font-bold leading-none", GLYPH_SIZE[size.value])}>أ</span>
                <span className="text-xs font-semibold">{size.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">معاينة</p>
          <p className="mt-1.5 font-bold text-zinc-900 dark:text-zinc-100">مراجعة الدرس الثالث في الفيزياء</p>
          <p className="mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            هكذا ستظهر النصوص في متقن: في المخطط، والاختبارات، وإجابات دليل.
          </p>
        </div>
      </section>

      {/* Language */}
      <section className={card}>
        <SectionHeader icon={Languages} title="اللغة" description="لغة واجهة التطبيق." />
        <div role="radiogroup" aria-label="اللغة" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LANGUAGES.map((lang) => {
            const selected = mounted && language === lang.value;
            return (
              <button
                key={lang.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={!lang.available}
                disabled={!lang.available}
                onClick={() => setLanguage(lang.value)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3.5 text-start transition",
                  selected
                    ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-500/10"
                    : "border-zinc-200 dark:border-zinc-800",
                  lang.available
                    ? !selected && "hover:border-zinc-300 dark:hover:border-zinc-700"
                    : "cursor-not-allowed opacity-60",
                )}
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{lang.label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400" dir="ltr">
                    {lang.native}
                  </p>
                </div>
                {lang.available ? (
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-700"
                        : "border-zinc-300 dark:border-zinc-600",
                    )}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    قريبًا
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AppearanceSettingsPage;
