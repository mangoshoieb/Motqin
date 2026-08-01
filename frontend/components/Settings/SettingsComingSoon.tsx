"use client";

interface SettingsComingSoonProps {
  title: string;
}

// Shared placeholder for every settings section until its real form lands.
export const SettingsComingSoon = ({ title }: SettingsComingSoonProps) => {
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 p-10 text-center dark:bg-zinc-900 dark:border-zinc-800">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">هذا القسم قيد الإعداد، سيكون متاحًا قريبًا.</p>
    </div>
  );
};
