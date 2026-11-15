// The signed-in student's own numbers shown on the home page's feature
// pieces (المخطط / المسابقات / متقن / منع المشتتات).
// MOCK SHAPE — no endpoint yet; adjust to the real payload once the backend
// sends it.
export interface HomeFeatureStats {
  planner: {
    todaySessions: number;
    completedSessions: number;
  } | null;
  competitions: {
    rank: number | null; // null when the student hasn't joined one yet
  } | null;
  quiz: {
    lastScorePercent: number | null; // null before the first quiz
  } | null;
  blocker: {
    // "HH:mm" (Cairo) when a block is running, null otherwise.
    activeUntil: string | null;
  } | null;
}
