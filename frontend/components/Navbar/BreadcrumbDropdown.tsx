"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface BreadcrumbOption {
  key: string | number;
  label: string;
  href: string;
  isActive: boolean;
}

interface BreadcrumbDropdownProps {
  label: string;
  options: BreadcrumbOption[];
  // When set, picking any option first asks for confirmation instead of
  // navigating right away — used while an active quiz session is running,
  // since leaving it ends the session.
  confirmMessage?: string;
}

// One breadcrumb segment — a clickable label that opens a dropdown of its
// siblings (e.g. the subject name opens a list of every subject) so the
// student can jump directly to one, Notion-style.
const CLOSE_DELAY_MS = 500;

export const BreadcrumbDropdown = ({ label, options, confirmMessage }: BreadcrumbDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Clear any pending close timer on unmount so it doesn't fire after.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  };

  const handleOptionClick = (e: React.MouseEvent, href: string) => {
    setIsOpen(false);
    if (!confirmMessage) return;
    e.preventDefault();
    setPendingHref(href);
  };

  return (
    <div className="relative" ref={containerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <span className="max-w-[160px] truncate">{label}</span>
      </button>

      {isOpen && options.length > 0 && (
        // max-h-36 (144px) = exactly 4 rows (py-2 + text-sm ≈ 36px each); the rest scrolls.
        <div className="absolute top-9 right-0 z-50 max-h-36 w-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {options.map((option) => (
            <Link
              key={option.key}
              href={option.href}
              onClick={(e) => handleOptionClick(e, option.href)}
              className={`block truncate px-4 py-2 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                option.isActive
                  ? "font-semibold text-blue-600 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      )}

      {pendingHref && (
        <ConfirmDialog
          title="إنهاء الجلسة؟"
          message={confirmMessage ?? "الانتقال الآن سينهي جلسة الاختبار الحالية."}
          confirmLabel="نعم، إنهاء الجلسة"
          cancelLabel="إلغاء"
          onCancel={() => setPendingHref(null)}
          onConfirm={() => {
            const href = pendingHref;
            setPendingHref(null);
            router.push(href);
          }}
        />
      )}
    </div>
  );
};
