// §8 same-browser pause/resume — mirrors the mobile app's
// QuizSystemLocalDataSource: a single global "current session" slot, not
// one per lesson. Starting a different lesson/category overwrites it, and
// "resume on the same device only; a different device starts over."

const STORAGE_KEY = "quizSession";

interface StoredSession {
  lessonId: string;
  category: string;
  snapshot: SessionSnapshot;
}

export const sessionStorageService = {
  save: (lessonId: string, category: string | undefined, snapshot: SessionSnapshot) => {
    if (typeof window === "undefined") return;

    const payload: StoredSession = { lessonId, category: category ?? "", snapshot };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage full or blocked — the session just won't be resumable.
    }
  },

  // Returns the saved snapshot only if it belongs to this lesson and
  // category — resuming anything else starts fresh.
  load: (lessonId: string, category: string | undefined): SessionSnapshot | null => {
    if (typeof window === "undefined") return null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const payload = JSON.parse(raw) as StoredSession;
      if (payload.lessonId !== lessonId || payload.category !== (category ?? "")) return null;

      return payload.snapshot;
    } catch {
      return null;
    }
  },

  clear: () => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  },
};
