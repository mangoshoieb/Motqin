import Link from "next/link";

// Placeholder — the real preferences form (free-time windows, days/hours
// available, etc.) would post to POST /api/planner/times once designed.
// This just gives the "planner preferences" link somewhere sensible to go
// instead of a bare 404.
const PlannerPreferencesPage = () => {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">تفضيلات المخطط</h1>
      <p className="text-zinc-500 dark:text-zinc-400">هذه الصفحة قيد الإعداد قريبًا.</p>
      <Link href="/planner" className="text-blue-600 dark:text-blue-400 font-medium">
        العودة إلى المخطط
      </Link>
    </div>
  );
};

export default PlannerPreferencesPage;
