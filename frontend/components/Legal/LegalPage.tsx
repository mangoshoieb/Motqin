import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalPageProps {
  title: string;
  icon: LucideIcon;
  /** Shown in the pill under the title, e.g. "1 يوليو 2026". */
  updatedAt: string;
  intro: ReactNode;
  sections: LegalSection[];
  /** The highlighted box under the last section. */
  notice?: ReactNode;
}

/**
 * The shared frame for the policy pages — privacy, terms, data deletion:
 * a sticky table of contents beside a single card of numbered sections.
 * Colours are declared for both themes here so the pages themselves carry
 * nothing but their text.
 */
export default function LegalPage({
  title,
  icon: Icon,
  updatedAt,
  intro,
  sections,
  notice,
}: LegalPageProps) {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--surface)] py-12 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Table of contents */}
        <aside className="hidden lg:block w-72 sticky top-8 self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              محتويات الصفحة
            </h2>

            <nav className="space-y-3 text-sm">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-zinc-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                <Icon className="text-blue-600 dark:text-blue-400" size={28} />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                  {title}
                </h1>

                <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  آخر تحديث: {updatedAt}
                </span>
              </div>
            </div>

            <div className="mb-12 leading-8 text-zinc-600 dark:text-zinc-300 [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100">
              {intro}
            </div>

            <div className="space-y-12">
              {sections.map((section) => (
                <section id={section.id} key={section.id} className="scroll-mt-20">
                  <h2 className="mb-5 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {section.title}
                  </h2>

                  <div className="leading-8 text-zinc-700 dark:text-zinc-300 [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            {notice && (
              <div className="mt-14 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="font-semibold leading-8 text-blue-800 dark:text-blue-200">
                  {notice}
                </div>
              </div>
            )}

            <div className="mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowRight size={18} />
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
