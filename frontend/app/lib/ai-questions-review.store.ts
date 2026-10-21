import { create } from "zustand";
import type { QuestionDraft } from "./question-draft";

// AI-generated questions waiting on the review page before they're saved.
// Memory only: a response with its images runs to megabytes, past what
// sessionStorage reliably holds — the review page guards against leaving
// instead.

export interface ReviewItem {
  // Stable across edits, removals and re-inserts (React key, DOM id).
  key: string;
  draft: QuestionDraft;
  pageNumber: number | null;
  edited: boolean;
  // Set when saving this one failed; cleared on the next edit or attempt.
  saveError: string | null;
}

interface AiQuestionsReviewStore {
  lessonId: number | null;
  items: ReviewItem[];

  start: (lessonId: number, items: ReviewItem[]) => void;
  updateDraft: (key: string, patch: Partial<QuestionDraft>) => void;
  remove: (key: string) => { item: ReviewItem; index: number } | null;
  insert: (item: ReviewItem, index: number) => void;
  setSaveError: (key: string, error: string | null) => void;
  clear: () => void;
}

export const useAiQuestionsReviewStore = create<AiQuestionsReviewStore>((set, get) => ({
  lessonId: null,
  items: [],

  start: (lessonId, items) => set({ lessonId, items }),

  updateDraft: (key, patch) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.key === key
          ? { ...item, draft: { ...item.draft, ...patch }, edited: true, saveError: null }
          : item
      ),
    })),

  remove: (key) => {
    const index = get().items.findIndex((item) => item.key === key);
    if (index < 0) return null;
    const item = get().items[index];
    set((state) => ({ items: state.items.filter((i) => i.key !== key) }));
    return { item, index };
  },

  insert: (item, index) =>
    set((state) => {
      const items = [...state.items];
      items.splice(Math.min(index, items.length), 0, item);
      return { items };
    }),

  setSaveError: (key, error) =>
    set((state) => ({
      items: state.items.map((item) => (item.key === key ? { ...item, saveError: error } : item)),
    })),

  clear: () => set({ lessonId: null, items: [] }),
}));
