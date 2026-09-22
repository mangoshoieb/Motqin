"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Strikethrough,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

// Notes are stored as the HTML this editor produces; an old plain-text note
// loads fine (Tiptap wraps it in a paragraph). `isRichTextEmpty` is what
// callers use to decide whether there's a note at all — an "empty" editor
// still serialises to `<p></p>`.
export const isRichTextEmpty = (html: string | null | undefined) =>
  !html || html.replace(/<[^>]*>/g, "").trim().length === 0;

const extensions = (placeholder?: string) => [
  // Bold, italic, underline, strike, bullet + numbered lists come with the kit.
  StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder: placeholder ?? "" }),
];

interface ToolbarButton {
  icon: LucideIcon;
  title: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

const toolbar: ToolbarButton[] = [
  { icon: Bold, title: "عريض", isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  { icon: Italic, title: "مائل", isActive: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
  { icon: Underline, title: "تحته خط", isActive: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
  { icon: Strikethrough, title: "يتوسطه خط", isActive: (e) => e.isActive("strike"), run: (e) => e.chain().focus().toggleStrike().run() },
  { icon: List, title: "قائمة نقطية", isActive: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
  { icon: ListOrdered, title: "قائمة مرقمة", isActive: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
  { icon: ListChecks, title: "قائمة مهام", isActive: (e) => e.isActive("taskList"), run: (e) => e.chain().focus().toggleTaskList().run() },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  onEscape?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string; // the editing surface
  minHeightClass?: string;
}

/** Notes editor: a small formatting toolbar over a Tiptap surface. */
export function RichTextEditor({
  value,
  onChange,
  onBlur,
  onEscape,
  placeholder,
  autoFocus = false,
  className,
  minHeightClass = "min-h-22",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: extensions(placeholder),
    content: value,
    autofocus: autoFocus ? "end" : false,
    // The page is server-rendered; the editor must only mount on the client.
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        dir: "rtl",
        class: cn(
          "rich-text w-full text-sm text-zinc-900 outline-none dark:text-zinc-100",
          minHeightClass,
        ),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape" && onEscape) {
          onEscape();
          return true;
        }
        return false;
      },
    },
  });

  // Which toolbar buttons are "on" for the current selection. Read through
  // useEditorState so it updates on every transaction — including toggling
  // bold on an empty selection, which only sets a stored mark and wouldn't
  // otherwise re-render until the first character is typed.
  const activeStates = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current ? toolbar.map(({ isActive }) => isActive(current)) : toolbar.map(() => false),
  });

  // Keep the surface in sync when the caller resets the value (e.g. Escape
  // restores the saved note) without clobbering what's being typed.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white transition focus-within:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:border-blue-500",
        className,
      )}
    >
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-zinc-100 px-1.5 py-1 dark:border-zinc-700"
        // Keep the editor's selection while pressing a toolbar button.
        onMouseDown={(event) => event.preventDefault()}
      >
        {toolbar.map(({ icon: Icon, title, run }, position) => (
          <button
            key={title}
            type="button"
            title={title}
            aria-label={title}
            disabled={!editor}
            onClick={() => editor && run(editor)}
            className={cn(
              "flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100",
              activeStates?.[position] && "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
            )}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

interface RichTextContentProps {
  value: string;
  className?: string;
}

/** Read-only rendering of a note saved by RichTextEditor. */
export function RichTextContent({ value, className }: RichTextContentProps) {
  const editor = useEditor({
    extensions: extensions(),
    content: value,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { dir: "rtl", class: cn("rich-text text-sm", className) },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  return <EditorContent editor={editor} />;
}
