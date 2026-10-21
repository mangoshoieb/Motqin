"use client";

import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import {
  useAchievementLeaders,
  useReferralLeaders,
  useStreakLeaders,
} from "@/app/hooks/useCompetitions";
import { formatDays, LEADERBOARD_SIZE } from "@/app/constants/competition.constants";
import { educationalStageLabel, gradeLevelLabel } from "@/app/constants/user.constants";
import { formatMinutes } from "@/app/lib/duration";
import { LeaderboardStudent } from "@/app/types/competition.types";
import { Leaderboard } from "./Leaderboard";

// The fields every board's row shares, formatted.
const studentView = (student: LeaderboardStudent) => ({
  userId: student.userId,
  rank: student.rank,
  fullName: student.fullName,
  photoUrl: student.profilePictureUrl,
  subtitle: `${gradeLevelLabel(student.gradeLevel)} · ${educationalStageLabel(student.educationalStage)}`,
});

const NOT_RANKED = `لست ضمن أول ${LEADERBOARD_SIZE} بعد`;

// مسابقة الاستمرارية — consecutive days logged in (GET /competition/streak/{n}).
export const StreakBoard = () => {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useStreakLeaders();

  return (
    <Leaderboard
      icon="🔥"
      title="مسابقة الاستمرارية"
      description="الترتيب حسب عدد الأيام المتتالية التي سجّلت فيها دخولك — لا تكسر السلسلة!"
      rows={data?.filter((leader) => leader.currentStreak > 0).map((leader) => ({
        ...studentView(leader),
        value: String(leader.currentStreak),
        valueUnit: "يوم",
        // The longest streak can lag behind the current one server-side.
        details: [`أطول سلسلة: ${formatDays(Math.max(leader.longestStreak, leader.currentStreak))}`],
      }))}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      currentUserId={user?.id}
      emptyText="لا توجد سلاسل بعد — سجّل دخولك يوميًا لتظهر هنا"
      notRankedText={NOT_RANKED}
    />
  );
};

// مسابقة المشاركة — friends who joined with the student's invite code
// (GET /competition/referral/{n}).
export const ReferralBoard = () => {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useReferralLeaders();

  return (
    <Leaderboard
      icon="🤝"
      title="مسابقة المشاركة"
      description="الترتيب حسب عدد الأصدقاء الذين انضموا بكود دعوتك — شارك رابطك من الأعلى."
      // Nobody who hasn't invited anyone yet — a podium of zeros says nothing.
      rows={data?.filter((leader) => leader.invitedCount > 0).map((leader) => ({
        ...studentView(leader),
        value: String(leader.invitedCount),
        valueUnit: "صديق انضم",
      }))}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      currentUserId={user?.id}
      emptyText="لم ينضم أحد بدعوة بعد — كن أول من يدعو أصدقاءه"
      notRankedText={NOT_RANKED}
    />
  );
};

// Hours with one decimal from an hour up, minutes below that.
const studyTime = (minutes: number) =>
  minutes >= 60
    ? { value: String(Math.round((minutes / 60) * 10) / 10), unit: "ساعة مذاكرة" }
    : { value: String(minutes), unit: "دقيقة مذاكرة" };

// weekEnd is the next week's first midnight (exclusive), so the last day
// shown is the one before it. The bounds are UTC midnights, so they're read
// in UTC — local time would push the end into the next day east of Greenwich.
const weekDay = (value: string, exclusiveEnd = false) =>
  new Date(new Date(value).getTime() - (exclusiveEnd ? 1 : 0)).toLocaleDateString("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

// مسابقة الإنجاز — minutes studied this week (GET /competition/achievement/{n}).
export const AchievementBoard = () => {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useAchievementLeaders();
  const week = data?.[0];

  return (
    <Leaderboard
      icon="📚"
      title="مسابقة الإنجاز"
      description="الترتيب حسب وقت المذاكرة الفعلي هذا الأسبوع — يبدأ العدّ من جديد كل أسبوع."
      extra={
        week && (
          <p className="mt-1.5 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            الأسبوع: {weekDay(week.weekStart)} – {weekDay(week.weekEnd, true)}
          </p>
        )
      }
      rows={data?.filter((leader) => leader.totalMinutes > 0).map((leader) => {
        const time = studyTime(leader.totalMinutes);
        return {
          ...studentView(leader),
          value: time.value,
          valueUnit: time.unit,
          details: [
            `${leader.sessionsCount} جلسة`,
            `${formatDays(leader.daysStudied)} مذاكرة`,
            `أطول جلسة: ${formatMinutes(leader.longestSessionMinutes)}`,
          ],
        };
      })}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      currentUserId={user?.id}
      emptyText="لم يذاكر أحد هذا الأسبوع بعد — ابدأ جلسة لتتصدر"
      notRankedText={NOT_RANKED}
    />
  );
};
