import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TableColor, TableDensity, TABLE_COLOR_ORDER } from "../constants/tracking-table.constants";

// How each tracking table looks on this device: its accent color, its row
// size and the columns hidden from view. The API stores none of this, so it
// lives in the browser until the backend has fields for it.

export interface TableView {
  color: TableColor;
  density: TableDensity;
  hidden: string[]; // column ids, or "studentPhone" / "parentPhone"
}

interface TableViewState {
  views: Record<string, TableView>;
  update: (groupId: string, patch: Partial<TableView>) => void;
  toggleHidden: (groupId: string, fieldId: string) => void;
}

// A new table gets a color picked from its id, so cards differ from the start.
export const defaultView = (groupId: string): TableView => {
  const hash = [...groupId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return { color: TABLE_COLOR_ORDER[hash % TABLE_COLOR_ORDER.length], density: "normal", hidden: [] };
};

export const useTableViewStore = create<TableViewState>()(
  persist(
    (set) => ({
      views: {},
      update: (groupId, patch) =>
        set((state) => ({
          views: {
            ...state.views,
            [groupId]: { ...(state.views[groupId] ?? defaultView(groupId)), ...patch },
          },
        })),
      toggleHidden: (groupId, fieldId) =>
        set((state) => {
          const view = state.views[groupId] ?? defaultView(groupId);
          const hidden = view.hidden.includes(fieldId)
            ? view.hidden.filter((id) => id !== fieldId)
            : [...view.hidden, fieldId];
          return { views: { ...state.views, [groupId]: { ...view, hidden } } };
        }),
    }),
    { name: "motqin:tracking-table-views" },
  ),
);

export const useTableView = (groupId: string): TableView =>
  useTableViewStore((state) => state.views[groupId]) ?? defaultView(groupId);
