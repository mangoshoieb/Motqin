import {
  Achievement,
  Challenge,
  League,
  LeagueMember,
  LeagueZone,
  MyRankCard,
  PointsBreakdownEntry,
} from "@/app/types/competition.types";

// Mock data — there is no CompetitionsController on the backend yet. Dates are
// computed relative to "now" rather than hardcoded so the countdowns stay
// believable however long this runs on mock data.

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const daysAgo = (days: number) => daysFromNow(-days);

// Sunday-to-Sunday reset: hours until the coming Sunday, so the league
// countdown ticks down over the week like the real thing would.
const nextSundayReset = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
};

// The signed-in student's week, itemised. Every line traces back to a real
// DayOutputs signal (tasks / focus minutes / quiz accuracy) priced by
// POINT_RULES — so the total below is *derived*, never a magic number. Peers'
// scores are then set around it to land the student 6th of 30: outside the
// promotion zone but a closable gap away, which is the state worth designing
// the whole screen around.
const MY_BREAKDOWN: PointsBreakdownEntry[] = [
  { source: "tasks", points: 420, detail: "28 مهمة منجزة" }, // 28 × 15
  { source: "focus", points: 550, detail: "22 ساعة و55 دقيقة تركيز" }, // 55 × 10
  { source: "quiz", points: 510, detail: "20 اختبارًا بدقة 85%" }, // 20 × (0.85 × 30)
  { source: "fullDay", points: 240, detail: "6 أيام مكتملة" }, // 6 × 40
  { source: "streak", points: 35, detail: "سلسلة 7 أيام" }, // 7 × 5
];

const CURRENT_USER_POINTS = MY_BREAKDOWN.reduce((sum, e) => sum + e.points, 0);

// 29 peers + the current user. Points are shaped so the gaps near the
// promotion line are small (a realistic week of studying closes them) and grow
// toward the tail.
const PEERS: { name: string; avatar: string; points: number; streak: number }[] = [
  { name: "أحمد محمد", avatar: "🧑‍🎓", points: 2850, streak: 15 },
  { name: "فاطمة علي", avatar: "👩‍🎓", points: 2720, streak: 12 },
  { name: "محمد أحمد", avatar: "🧑‍💻", points: 2190, streak: 10 },
  { name: "نور الهدى", avatar: "👩‍🔬", points: 1980, streak: 8 },
  { name: "يوسف إبراهيم", avatar: "🧑‍🏫", points: 1825, streak: 6 },
  // ← current user slots in here (1755), 70 points off promotion
  { name: "مريم حسن", avatar: "👩‍💼", points: 1695, streak: 9 },
  { name: "عبد الرحمن سعيد", avatar: "🧑‍🎤", points: 1640, streak: 4 },
  { name: "سارة خالد", avatar: "👩‍🎨", points: 1520, streak: 7 },
  { name: "كريم عادل", avatar: "🧑‍🔧", points: 1475, streak: 3 },
  { name: "هبة مصطفى", avatar: "👩‍⚕️", points: 1390, streak: 5 },
  { name: "طارق فؤاد", avatar: "🧑‍🚀", points: 1280, streak: 2 },
  { name: "ليلى عمرو", avatar: "👩‍🏫", points: 1205, streak: 6 },
  { name: "زياد ماهر", avatar: "🧑‍⚖️", points: 1130, streak: 1 },
  { name: "دينا وليد", avatar: "👩‍🔧", points: 1075, streak: 4 },
  { name: "عمر ياسر", avatar: "🧑‍🌾", points: 980, streak: 3 },
  { name: "جنى أشرف", avatar: "👩‍🚀", points: 920, streak: 2 },
  { name: "حسام نبيل", avatar: "🧑‍🍳", points: 865, streak: 5 },
  { name: "رنا سامي", avatar: "👩‍🎤", points: 790, streak: 1 },
  { name: "مازن هشام", avatar: "🧑‍🔬", points: 720, streak: 2 },
  { name: "آية جمال", avatar: "👩‍🌾", points: 655, streak: 3 },
  { name: "شريف رأفت", avatar: "🧑‍💼", points: 580, streak: 1 },
  { name: "ملك طارق", avatar: "👩‍💻", points: 505, streak: 2 },
  { name: "أدهم صلاح", avatar: "🧑‍🎨", points: 430, streak: 1 },
  { name: "تالا محمود", avatar: "👩‍⚖️", points: 365, streak: 1 },
  { name: "سيف الدين", avatar: "🧑‍🏭", points: 290, streak: 0 },
  { name: "لمى رامي", avatar: "👩‍🍳", points: 215, streak: 0 },
  { name: "بلال منير", avatar: "🧑‍✈️", points: 160, streak: 0 },
  { name: "روان تامر", avatar: "👩‍✈️", points: 95, streak: 0 },
  { name: "خالد فتحي", avatar: "🧑‍🎓", points: 40, streak: 0 },
];

const CURRENT_USER = {
  name: "أنت",
  avatar: "🎯",
  points: CURRENT_USER_POINTS,
  streak: 7,
};

const buildMembers = (): LeagueMember[] =>
  [...PEERS.map((p) => ({ ...p, isCurrentUser: false })), { ...CURRENT_USER, isCurrentUser: true }]
    .sort((a, b) => b.points - a.points)
    .map((m, i) => ({
      userId: m.isCurrentUser ? "me" : `peer-${i}`,
      displayName: m.name,
      avatarEmoji: m.avatar,
      points: m.points,
      rank: i + 1,
      streakDays: m.streak,
      isCurrentUser: m.isCurrentUser,
    }));

export const myLeague: League = {
  leagueId: "league-gold-14",
  tier: "gold",
  weekLabel: "الأسبوع الحالي",
  endsAt: nextSundayReset(),
  promoteCount: 5,
  relegateCount: 5,
  members: buildMembers(),
};

// Derived from the league above rather than restated, so rank, zone and the
// gap to the next place can never drift out of sync with the board the student
// is looking at.
const myMember = myLeague.members.find((m) => m.isCurrentUser)!;
const above = myLeague.members.find((m) => m.rank === myMember.rank - 1);

const zoneFor = (rank: number, league: League): LeagueZone => {
  if (rank <= league.promoteCount) return "promotion";
  if (rank > league.members.length - league.relegateCount) return "relegation";
  return "safe";
};

export const myRankCard: MyRankCard = {
  displayName: myMember.displayName,
  avatarEmoji: myMember.avatarEmoji,
  tier: myLeague.tier,
  weeklyPoints: myMember.points,
  rank: myMember.rank,
  previousRank: 9, // last week's finish — no league history to derive it from
  streakDays: myMember.streakDays,
  zone: zoneFor(myMember.rank, myLeague),
  pointsToNextRank: above ? above.points - myMember.points : null,
  privateMode: false,
  breakdown: MY_BREAKDOWN,
};

// Official competitions map onto Competition rows; duels are the same model
// with two participants. Rewards follow the agreed split — in-app rewards on
// the weekly stuff, cash reserved for the flagship monthly event.
export const challenges: Challenge[] = [
  {
    competitionId: 1,
    title: "ماراثون الرياضيات الأسبوعي",
    description:
      "أنهِ أكبر عدد من اختبارات الرياضيات بأعلى دقة خلال الأسبوع. الدقة تُحتسب قبل العدد.",
    startDate: daysAgo(2),
    endDate: daysFromNow(3),
    kind: "official",
    metric: "quiz",
    subjectName: "الرياضيات",
    participants: 156,
    rewards: [
      { kind: "badge", label: "شارة بطل الرياضيات" },
      { kind: "subscription", label: "خصم 25% على التجديد" },
    ],
    status: "joined",
    myEntry: { entryId: 11, competitionId: 1, userId: "me", score: 640, rank: 12 },
  },
  {
    competitionId: 2,
    title: "تحدي الانضباط",
    description:
      "أنجز كل مهام يومك سبعة أيام متتالية. لا يعتمد على مادة بعينها — الالتزام وحده هو المقياس.",
    startDate: daysAgo(1),
    endDate: daysFromNow(6),
    kind: "official",
    metric: "tasks",
    participants: 412,
    rewards: [
      { kind: "badge", label: "شارة أسبوع بلا تأجيل" },
      { kind: "subscription", label: "شهر مجاني" },
    ],
    status: "open",
  },
  {
    competitionId: 3,
    title: "بطولة متقن الشهرية",
    description:
      "البطولة الكبرى: مجموع نقاط الإتقان خلال الشهر كاملًا عبر كل المواد. تُعلن النتائج في آخر يوم من الشهر.",
    startDate: daysAgo(5),
    endDate: daysFromNow(24),
    kind: "official",
    metric: "quiz",
    participants: 1284,
    rewards: [
      { kind: "cash", label: "الجائزة الأولى 1000 جنيه" },
      { kind: "badge", label: "شارة بطل الشهر" },
    ],
    status: "open",
  },
  {
    competitionId: 4,
    title: "سباق ساعات المذاكرة",
    description:
      "من يجمع أكبر عدد من ساعات التركيز الفعلية هذا الأسبوع؟ تُحتسب جلسات التركيز المكتملة فقط.",
    startDate: daysAgo(3),
    endDate: daysFromNow(4),
    kind: "official",
    metric: "studyHours",
    participants: 203,
    rewards: [{ kind: "badge", label: "شارة ساعات الذهب" }],
    status: "joined",
    myEntry: { entryId: 14, competitionId: 4, userId: "me", score: 19, rank: 7 },
  },
  {
    competitionId: 5,
    title: "تحدٍ ثنائي: الكيمياء",
    description: "تحدٍ مباشر على وحدة الأحماض والقواعد — الأعلى دقة يفوز.",
    startDate: daysAgo(1),
    endDate: daysFromNow(2),
    kind: "duel",
    metric: "quiz",
    subjectName: "الكيمياء",
    participants: 2,
    rewards: [{ kind: "badge", label: "شارة المبارز" }],
    status: "joined",
    myEntry: { entryId: 21, competitionId: 5, userId: "me", score: 340, rank: 1 },
    opponent: { displayName: "كريم عادل", avatarEmoji: "🧑‍🔧", score: 295 },
  },
  {
    competitionId: 6,
    title: "تحدٍ ثنائي: مهام الأسبوع",
    description: "من ينجز مهام مخططه الأسبوعي بالكامل أولًا؟",
    startDate: daysAgo(4),
    endDate: daysAgo(1),
    kind: "duel",
    metric: "tasks",
    participants: 2,
    rewards: [{ kind: "badge", label: "شارة المبارز" }],
    status: "ended",
    myEntry: { entryId: 22, competitionId: 6, userId: "me", score: 18, rank: 1 },
    opponent: { displayName: "مريم حسن", avatarEmoji: "👩‍💼", score: 15 },
  },
];

export const achievements: Achievement[] = [
  {
    id: "no-postpone-week",
    title: "أسبوع بلا تأجيل",
    description: "أنهِ كل مهام أسبوع كامل دون تأجيل أي مهمة.",
    category: "discipline",
    icon: "🗓️",
    unlockedAt: daysAgo(12),
    progress: 1,
    progressLabel: "مكتملة",
  },
  {
    id: "streak-30",
    title: "سلسلة الثلاثين",
    description: "ذاكر ٣٠ يومًا متتالية دون انقطاع.",
    category: "discipline",
    icon: "🔥",
    unlockedAt: null,
    progress: 7 / 30,
    progressLabel: "7 / 30 يوم",
  },
  {
    id: "focus-100h",
    title: "مئة ساعة تركيز",
    description: "اجمع ١٠٠ ساعة من جلسات التركيز المكتملة.",
    category: "focus",
    icon: "⏱️",
    unlockedAt: null,
    progress: 72 / 100,
    progressLabel: "72 / 100 ساعة",
  },
  {
    id: "deep-session",
    title: "جلسة عميقة",
    description: "أكمل جلسة تركيز واحدة مدتها ٩٠ دقيقة دون توقف.",
    category: "focus",
    icon: "🧘",
    unlockedAt: daysAgo(4),
    progress: 1,
    progressLabel: "مكتملة",
  },
  {
    id: "accuracy-90",
    title: "دقة التسعين",
    description: "حافظ على دقة ٩٠٪ أو أعلى عبر ٢٠ اختبارًا متتاليًا.",
    category: "mastery",
    icon: "🎯",
    unlockedAt: null,
    progress: 14 / 20,
    progressLabel: "14 / 20 اختبارًا",
  },
  {
    id: "subject-master",
    title: "متقن المادة",
    description: "أنهِ كل دروس مادة واحدة بدقة لا تقل عن ٨٠٪.",
    category: "mastery",
    icon: "📚",
    unlockedAt: null,
    progress: 0.45,
    progressLabel: "45% من الكيمياء",
  },
  {
    id: "first-promotion",
    title: "أول ترقية",
    description: "اصعد من دوري إلى الدوري الأعلى لأول مرة.",
    category: "social",
    icon: "⬆️",
    unlockedAt: daysAgo(21),
    progress: 1,
    progressLabel: "مكتملة",
  },
  {
    id: "duel-winner",
    title: "المبارز",
    description: "افز بخمسة تحديات ثنائية.",
    category: "social",
    icon: "⚔️",
    unlockedAt: null,
    progress: 2 / 5,
    progressLabel: "2 / 5 تحديات",
  },
];
