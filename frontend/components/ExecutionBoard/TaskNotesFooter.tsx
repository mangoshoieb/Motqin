"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, NotebookPen, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { RichTextContent, RichTextEditor, isRichTextEmpty } from "@/components/ui/RichTextEditor";

// The notes colour — the footer's background. It's the --notes-bg the task
// card defines (ExecutionTaskRow) and frames its lower sides with, so the
// frame and the footer are exactly the same colour.
const NOTES_TINT = "bg-(--notes-bg)";

// How long typing has to pause before the note saves itself.
const AUTOSAVE_MS = 1000;

// First line of a note as plain text, for the collapsed footer's preview.
const previewOf = (html: string) =>
  html
    .replace(/<\/(p|li|div)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

interface TaskNotesFooterProps {
  notes: string[]; // the student's own (userNotes), oldest first
  systemNotes?: string[]; // from the AI planner — shown, never edited
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Bumped by the options menu's "إضافة ملاحظة" to open a new-note editor.
  composeRequest: number;
  onChange: (notes: string[]) => void;
}

// A thin footer along the bottom of the task card: the notes icon, how many
// there are and a preview of the latest, plus "add". Opening it lists every
// note, each one editable and deletable on its own. There's no save button:
// a note saves itself a moment after typing stops and when the editor loses
// focus; Escape drops what wasn't saved yet.
export const TaskNotesFooter = ({
  notes,
  systemNotes = [],
  open,
  onOpenChange,
  composeRequest,
  onChange,
}: TaskNotesFooterProps) => {
  // Which note is in the editor: its index, "new" for one being written, or
  // none. A new note's first autosave appends it; savedAs is where it landed,
  // so later saves update it — while the editor stays in the same spot and
  // keeps focus.
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [savedAs, setSavedAs] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  // What the open note held before this edit, for Escape.
  const [original, setOriginal] = useState<string | null>(null);

  const startEditing = (target: number | "new") => {
    const value = target === "new" ? "" : notes[target] ?? "";
    setOriginal(target === "new" ? null : value);
    setSavedAs(null);
    setDraft(value);
    setEditing(target);
    onOpenChange(true);
  };

  // The menu asked for a new note.
  const [seenRequest, setSeenRequest] = useState(composeRequest);
  if (composeRequest !== seenRequest) {
    setSeenRequest(composeRequest);
    setOriginal(null);
    setSavedAs(null);
    setDraft("");
    setEditing("new");
  }

  // Saves the draft if it differs from what's stored; `close` also shuts
  // the editor (on blur). An emptied note is removed.
  const commit = (close: boolean) => {
    if (editing === null) return;
    const empty = isRichTextEmpty(draft);
    const target = editing === "new" ? savedAs : editing;
    let remaining = notes.length;
    if (target === null) {
      if (!empty) {
        onChange([...notes, draft]);
        setSavedAs(notes.length);
        remaining += 1;
      }
    } else if (draft !== notes[target]) {
      onChange(empty ? notes.filter((_, i) => i !== target) : notes.map((note, i) => (i === target ? draft : note)));
      if (empty) {
        close = true;
        remaining -= 1;
      }
    }
    if (close) {
      setEditing(null);
      setSavedAs(null);
      collapseIfEmpty(remaining);
    }
  };

  // Nothing written and nothing left: shrink back to the half box.
  const collapseIfEmpty = (remainingNotes: number) => {
    if (remainingNotes + systemNotes.length === 0) onOpenChange(false);
  };

  // Autosave once typing pauses.
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });
  useEffect(() => {
    if (editing === null) return;
    const timer = window.setTimeout(() => commitRef.current(false), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, editing]);

  // Escape: put the note back as it was before this edit (a new one is
  // dropped altogether).
  const revert = () => {
    if (editing === "new") {
      // Already autosaved once — take it back out.
      if (savedAs !== null) onChange(notes.filter((_, i) => i !== savedAs));
      setEditing(null);
      setSavedAs(null);
      collapseIfEmpty(savedAs !== null ? notes.length - 1 : notes.length);
    } else if (editing !== null) {
      const before = original;
      if (before !== null && notes[editing] !== before) {
        onChange(notes.map((note, i) => (i === editing ? before : note)));
      }
      setEditing(null);
    }
    setDraft("");
  };

  const remove = (index: number) => {
    const before = notes;
    onChange(notes.filter((_, i) => i !== index));
    // Clicking delete has already blurred (and closed) any open editor.
    if (editing === index) setEditing(null);
    collapseIfEmpty(notes.length - 1);
    toast.success("تم حذف الملاحظة", {
      action: { label: "تراجع", onClick: () => onChange(before) },
    });
  };

  const total = notes.length + systemNotes.length;
  const latest = notes.at(-1) ?? systemNotes.at(-1);

  const editor = (
    <RichTextEditor
      value={draft}
      onChange={setDraft}
      onBlur={() => commitRef.current(true)}
      onEscape={revert}
      placeholder="اكتب ملاحظتك... تُحفظ تلقائيًا"
      autoFocus
      minHeightClass="min-h-16"
    />
  );

  const countLabel =
    total === 1 ? "ملاحظة واحدة" : total === 2 ? "ملاحظتان" : `${total} ملاحظات`;

  return (
    // Collapsed, the box covers the right half of the card's bottom; a click
    // anywhere on it widens it to the full width (past the card's 8px side
    // frame) and opens a new note to type into.
    <div
      className={cn(
        "relative -mx-2 self-start transition-[width,border-radius] duration-300 ease-out",
        NOTES_TINT,
        open ? "w-[calc(100%+1rem)] rounded-b-lg" : "w-[calc(50%+0.5rem)] rounded-br-lg rounded-l-xl",
      )}
    >
      {open ? (
        <div className="flex h-10 items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => {
              if (editing !== null) commit(true);
              onOpenChange(false);
            }}
            aria-expanded
            title="إخفاء الملاحظات"
            className="flex min-w-0 flex-1 items-center gap-2 text-right text-xs text-amber-900/80 transition hover:text-amber-950 dark:text-amber-200/80 dark:hover:text-amber-100"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <NotebookPen size={13} />
            </span>
            {total > 0 && <span className="shrink-0 font-semibold">{countLabel}</span>}
            <ChevronDown size={14} className="shrink-0 rotate-180" />
          </button>

          {editing !== "new" && (
            <button
              type="button"
              onClick={() => startEditing("new")}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-white/60 dark:text-amber-200 dark:hover:bg-amber-950/50"
            >
              <Plus size={12} />
              إضافة ملاحظة
            </button>
          )}
        </div>
      ) : (
        // The whole half box is the way in.
        <button
          type="button"
          onClick={() => startEditing("new")}
          aria-expanded={false}
          aria-label="إضافة ملاحظة"
          title={total > 0 ? "عرض الملاحظات وإضافة ملاحظة" : "إضافة ملاحظة"}
          className="flex h-10 w-full min-w-0 cursor-text items-center gap-2 px-4 text-right text-xs text-amber-900/80 dark:text-amber-200/80"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <NotebookPen size={13} />
          </span>
          {total > 0 && <span className="shrink-0 font-semibold">{countLabel}</span>}
          {latest && (
            <span className="min-w-0 truncate text-amber-800/60 dark:text-amber-200/50">· {previewOf(latest)}</span>
          )}
        </button>
      )}

      {open && (total > 0 || editing !== null) && (
        <div className="flex flex-col gap-2 border-t border-amber-200/70 px-4 py-3 dark:border-amber-800/40">
          {systemNotes.map((note, index) => (
            <div
              key={`system-${index}`}
              className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 dark:border-violet-900/40 dark:bg-violet-950/30"
            >
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                <Sparkles size={11} />
                من المخطط الذكي
              </p>
              <RichTextContent value={note} className="text-sm text-zinc-600 dark:text-zinc-300" />
            </div>
          ))}

          {notes.map((note, index) =>
            // The new note being written stays in the trailing editor below.
            editing === "new" && index === savedAs ? null : editing === index ? (
              <div key={index}>{editor}</div>
            ) : (
              <div
                key={index}
                className="group flex items-start gap-2 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-zinc-900"
              >
                <div
                  role="button"
                  tabIndex={0}
                  title="تعديل الملاحظة"
                  onClick={() => startEditing(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") startEditing(index);
                  }}
                  className="min-w-0 flex-1 cursor-text"
                >
                  <RichTextContent value={note} className="text-sm text-zinc-600 dark:text-zinc-300" />
                </div>
                <div className="flex shrink-0 gap-0.5 opacity-60 transition group-hover:opacity-100">
                  <button
                    type="button"
                    title="تعديل الملاحظة"
                    onClick={() => startEditing(index)}
                    className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    title="حذف الملاحظة"
                    onClick={() => remove(index)}
                    className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ),
          )}

          {editing === "new" && editor}
        </div>
      )}
    </div>
  );
};
