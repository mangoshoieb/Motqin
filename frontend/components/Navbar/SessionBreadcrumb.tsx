"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { BreadcrumbDropdown } from "./BreadcrumbDropdown";

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

// Matches the ?category= values used to filter the quiz (see the lesson
// page's CATEGORY_TABS) to the session-type label shown in the breadcrumb.
const CATEGORY_SESSION_LABELS: Record<string, string> = {
  "أساسيات": "جلسة مفاهيم أساسية",
  "معلومات إضافية": "جلسة مفاهيم إضافية",
  "معلومات مهمة": "جلسة مفاهيم متقدمة",
};

// Notion-style breadcrumb: Subject / Lesson, each segment a dropdown of its
// siblings. Only renders on /subjects/{subjectId}[/{lessonId}[/quiz]] —
// hidden everywhere else, and hidden on mobile regardless (see Nav.tsx).
export const SessionBreadcrumb = () => {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const subjectIdSlug = params?.subjectId as string | undefined;
  const lessonId = params?.lessonId as string | undefined;
  const numericSubjectId = subjectIdSlug?.split("-")[0];

  const { data: subjects } = useGetSubjects();
  const { data: lessonsData } = useGetLessons(numericSubjectId ?? "");

  if (!pathname.startsWith("/subjects/") || !subjectIdSlug) return null;

  // Leaving a quiz page (via either breadcrumb level) ends the session, so
  // gate navigation behind a confirmation while one is active.
  const inQuizSession = pathname.endsWith("/quiz");
  const confirmMessage = inQuizSession
    ? "أنت الآن في جلسة اختبار. الانتقال من هنا سينهي الجلسة الحالية، هل أنت متأكد؟"
    : undefined;

  const category = searchParams.get("category");
  const sessionLabel = inQuizSession && category ? CATEGORY_SESSION_LABELS[category] : undefined;

  const currentSubject = subjects?.find((s) => String(s.subjectID) === numericSubjectId);
  const currentLesson = lessonsData?.lessons?.find((l) => String(l.lessonId) === lessonId);

  const subjectOptions =
    subjects?.map((s) => ({
      key: s.subjectID,
      label: s.name,
      href: `/subjects/${s.subjectID}-${slugify(s.name)}`,
      isActive: String(s.subjectID) === numericSubjectId,
    })) ?? [];

  const lessonOptions =
    lessonsData?.lessons?.map((l) => ({
      key: l.lessonId,
      label: l.title,
      href: `/subjects/${subjectIdSlug}/${l.lessonId}`,
      isActive: String(l.lessonId) === lessonId,
    })) ?? [];

  return (
    <div dir="rtl" className="hidden md:flex items-center gap-2 text-sm">
      <BreadcrumbDropdown
        label={currentSubject?.name ?? "..."}
        options={subjectOptions}
        confirmMessage={confirmMessage}
      />

      {lessonId && (
        <>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <BreadcrumbDropdown
            label={currentLesson?.title ?? "..."}
            options={lessonOptions}
            confirmMessage={confirmMessage}
          />

          {sessionLabel && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="px-2 py-1 truncate max-w-[160px] font-medium text-zinc-500 dark:text-zinc-400">
                {sessionLabel}
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
};
