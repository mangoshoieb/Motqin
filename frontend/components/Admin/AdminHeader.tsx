import type { ReactNode } from "react";

// Title row of an admin screen, with its main actions on the left.
export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Chip({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "green" | "amber" | "blue" | "rose" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };
  return <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

// A coded error's details, for messages like features_incomplete's missing list.
export function ErrorBox({ message, extra }: { message: string; extra?: string[] }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
      <p className="font-semibold">{message}</p>
      {extra && extra.length > 0 && <p className="mt-1 text-xs opacity-80">{extra.join("، ")}</p>}
    </div>
  );
}
