"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { BLOCKER_LIMITS } from "@/app/constants/distraction-blocker.constants";
import { normalizeWebsite } from "@/app/lib/distraction-blocker";

// One-tap adds for the sites students block most; only the ones not in the
// list yet are offered.
const SUGGESTED_SITES = ["youtube.com", "facebook.com", "instagram.com", "tiktok.com", "x.com"];

interface WebsitesEditorProps {
  websites: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export const WebsitesEditor = ({ websites, onChange, disabled }: WebsitesEditorProps) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const atLimit = websites.length >= BLOCKER_LIMITS.WEBSITES;
  const suggestions = SUGGESTED_SITES.filter((site) => !websites.includes(site));

  // Accepts several at once (pasted with spaces, commas or new lines) and
  // full links — only the host is kept, as the server would.
  const addFromInput = () => {
    const entries = input.split(/[\s,،]+/).filter(Boolean);
    if (entries.length === 0) return;

    const next = [...websites];
    const invalid: string[] = [];
    for (const entry of entries) {
      const host = normalizeWebsite(entry);
      if (!host) invalid.push(entry);
      else if (!next.includes(host)) next.push(host);
    }

    if (next.length > BLOCKER_LIMITS.WEBSITES) {
      setError(`يمكنك حجب ${BLOCKER_LIMITS.WEBSITES} موقع على الأكثر.`);
      return;
    }

    onChange(next);
    setInput(invalid.join(" "));
    setError(
      invalid.length
        ? `${invalid.map((entry) => `«${entry}»`).join("، ")} ليس رابط موقع صالح.`
        : next.length === websites.length
          ? "هذا الموقع موجود في القائمة بالفعل."
          : null,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          addFromInput();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="blocked-website" className="sr-only">
          رابط الموقع
        </label>
        <input
          id="blocked-website"
          dir="ltr"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError(null);
          }}
          disabled={disabled || atLimit}
          placeholder="youtube.com أو https://www.youtube.com/..."
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={disabled || atLimit || !input.trim()}
          className="flex shrink-0 items-center justify-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Plus size={15} />
          حجب
        </button>
      </form>

      {error && <p className="-mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}

      {!disabled && !atLimit && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">اقتراحات:</span>
          {suggestions.map((site) => (
            <button
              key={site}
              type="button"
              dir="ltr"
              onClick={() => onChange([...websites, site])}
              className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs text-zinc-600 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              + {site}
            </button>
          ))}
        </div>
      )}

      {websites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          لا توجد مواقع محجوبة بعد.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {websites.map((site) => (
            <li
              key={site}
              className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 py-1 pe-1 ps-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
            >
              <span dir="ltr">{site}</span>
              <button
                type="button"
                onClick={() => onChange(websites.filter((s) => s !== site))}
                disabled={disabled}
                aria-label={`إزالة ${site}`}
                className="flex size-6 items-center justify-center rounded-full transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/40"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {websites.length} / {BLOCKER_LIMITS.WEBSITES} موقع
      </p>
    </div>
  );
};
