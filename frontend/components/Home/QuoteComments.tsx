"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CornerDownLeft, Flag, FlagOff, MessageCircle, Pencil, Reply, Send, ShieldOff, Trash2, X } from "lucide-react";
import { QuoteComment } from "@/app/types/quote.types";
import { useAuth } from "@/app/(public)/context/auth.context";
import {
  useAddQuoteComment,
  useDeleteQuoteComment,
  useUpdateQuoteComment,
} from "@/app/hooks/useQuoteComment";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ReportCommentDialog from "./ReportCommentDialog";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
];

function avatarColorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(name: string) {
  return name.trim().charAt(0).toUpperCase() || "؟";
}

function timeAgo(isoDate: string) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

// The API nests replies one level deep (CommentRenderDto.replies). If a
// response ever comes back flat with parentCommentId set instead, fold those
// under their parents so the UI is the same either way.
function buildThread(comments: QuoteComment[]): QuoteComment[] {
  const flatReplies = comments.filter((c) => c.parentCommentId);
  if (flatReplies.length === 0) return comments;

  const roots = comments.filter((c) => !c.parentCommentId);
  return roots.map((root) => {
    const extra = flatReplies.filter((r) => r.parentCommentId === root.id);
    const existing = root.replies ?? [];
    const merged = [...existing, ...extra.filter((r) => !existing.some((e) => e.id === r.id))];
    return merged.length ? { ...root, replies: merged } : root;
  });
}

const countAll = (comments: QuoteComment[]): number =>
  comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

// Comments shown before "عرض كل التعليقات", and after expanding (the rest
// scroll inside the box).
const COLLAPSED_COMMENTS = 2;
const EXPANDED_COMMENTS = 5;

// Long comments are clamped with a "عرض المزيد" toggle, Facebook-style.
const LONG_TEXT_CHARS = 180;
const LONG_TEXT_LINES = 3;

function CommentText({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > LONG_TEXT_CHARS || content.split("\n").length > LONG_TEXT_LINES;

  return (
    <div className="mt-1">
      <p
        className={`whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-zinc-300 ${
          isLong && !expanded ? "line-clamp-3" : ""
        }`}
      >
        {content}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-0.5 text-xs font-semibold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
        </button>
      )}
    </div>
  );
}

// Inline "write a reply" box shown under a comment.
function ReplyBox({
  quoteId,
  parentId,
  replyingTo,
  onDone,
}: {
  quoteId: number;
  parentId: number;
  replyingTo?: string;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const { mutate: addComment, isPending } = useAddQuoteComment();

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    addComment(
      { quoteId, content, parentCommentId: parentId },
      {
        onSuccess: () => {
          setText("");
          onDone();
        },
      },
    );
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <CornerDownLeft size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onDone();
        }}
        placeholder={replyingTo ? `الرد على ${replyingTo}...` : "اكتب ردًا..."}
        className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !text.trim()}
        title="إرسال الرد"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send size={14} />
      </button>
      <button
        type="button"
        onClick={onDone}
        title="إلغاء"
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function CommentItem({
  comment,
  quoteId,
  depth = 0,
  threadParentId,
}: {
  comment: QuoteComment;
  quoteId: number;
  depth?: number;
  // For replies: the top-level comment a new reply should attach to (the
  // API nests one level only).
  threadParentId?: number;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [replying, setReplying] = useState(false);
  // Replies stay folded behind "عرض N ردود" until asked for, like Facebook.
  const [showReplies, setShowReplies] = useState(false);
  // Remembered for this session so the same comment isn't reported twice.
  const [reported, setReported] = useState(false);

  const { mutate: updateComment, isPending: isUpdating } = useUpdateQuoteComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteQuoteComment();

  const isOwnComment = !!user && comment.userId === user.id;
  const displayName = comment.userName || "مستخدم";
  const isReply = depth > 0;
  const replies = comment.replies ?? [];
  const removedByAdmin = Boolean(comment.isDeletedByAdmin);

  const handleSaveEdit = () => {
    const content = draft.trim();
    if (!content || content === comment.content) {
      setIsEditing(false);
      return;
    }
    updateComment(
      { id: comment.id, content },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
          isReply ? "size-7 text-xs" : "size-9 text-sm"
        } ${avatarColorFor(displayName)}`}
      >
        {initialsFor(displayName)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {displayName}
            </span>
            <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
          </div>

          {isEditing ? (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
              >
                <Send size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setDraft(comment.content);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : removedByAdmin ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm italic text-zinc-400">
              <ShieldOff size={14} /> تم حذف هذا التعليق من قِبل الإدارة
            </p>
          ) : (
            <CommentText content={comment.content} />
          )}
        </div>

        {!isEditing && !removedByAdmin && (
          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-zinc-400">
            <button
              type="button"
              onClick={() => setReplying((open) => !open)}
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Reply size={12} /> رد
            </button>
            {isOwnComment ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Pencil size={12} /> تعديل
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 size={12} /> حذف
                </button>
              </>
            ) : (
              reported ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <FlagOff size={12} /> تم الإبلاغ
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setReporting(true)}
                  className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  <Flag size={12} /> إبلاغ
                </button>
              )
            )}
          </div>
        )}

        {replying && (
          <ReplyBox
            quoteId={quoteId}
            parentId={threadParentId ?? comment.id}
            replyingTo={isReply ? displayName : undefined}
            onDone={() => setReplying(false)}
          />
        )}

        {replies.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowReplies((open) => !open)}
              className="flex items-center gap-1 px-1 text-xs font-semibold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <CornerDownLeft size={12} />
              {showReplies
                ? "إخفاء الردود"
                : replies.length === 1
                  ? "عرض الرد"
                  : replies.length === 2
                    ? "عرض الردّين"
                    : `عرض ${replies.length} ردود`}
            </button>

            {showReplies && (
              <div className="mt-2 space-y-3 border-e-2 border-zinc-100 pe-3 dark:border-zinc-800">
                {replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    quoteId={quoteId}
                    depth={depth + 1}
                    threadParentId={threadParentId ?? comment.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {reporting && (
        <ReportCommentDialog
          commentId={comment.id}
          onClose={() => setReporting(false)}
          onReported={() => setReported(true)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="حذف التعليق"
          message="هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            deleteComment(comment.id, { onSuccess: () => setConfirmingDelete(false) });
          }}
        />
      )}
    </div>
  );
}

export default function QuoteComments({
  quoteId,
  comments,
}: {
  quoteId: number;
  comments: QuoteComment[];
}) {
  const [newComment, setNewComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { mutate: addComment, isPending } = useAddQuoteComment();
  const thread = buildThread(comments);
  const total = countAll(thread);
  const visible = expanded ? thread : thread.slice(0, COLLAPSED_COMMENTS);
  const hiddenCount = thread.length - visible.length;

  const handleSubmit = () => {
    const content = newComment.trim();
    if (!content) return;

    addComment(
      { quoteId, content },
      { onSuccess: () => setNewComment("") }
    );
  };

  return (
    <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="mb-4 flex w-full items-center justify-between text-sm font-bold text-zinc-700 dark:text-zinc-300"
      >
        <span className="flex items-center gap-1.5">
          <MessageCircle size={15} className="text-blue-600 dark:text-blue-400" />
          التعليقات ({total})
        </span>
        {thread.length > COLLAPSED_COMMENTS && (
          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
            {expanded ? "عرض أقل" : "عرض الكل"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="اكتب تعليقًا..."
          className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-transparent px-4 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-blue-950"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !newComment.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>

      {thread.length > 0 ? (
        <>
          {/* Expanded: ~EXPANDED_COMMENTS rows tall, the rest scroll. */}
          <div
            className={`mt-5 space-y-4 pe-1 ${expanded ? "overflow-y-auto" : ""}`}
            style={expanded ? { maxHeight: `${EXPANDED_COMMENTS * 5.6}rem` } : undefined}
          >
            {visible.map((comment) => (
              <CommentItem key={comment.id} comment={comment} quoteId={quoteId} />
            ))}
          </div>

          {!expanded && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ChevronDown size={14} />
              عرض كل التعليقات ({thread.length})
            </button>
          )}
        </>
      ) : (
        <p className="mt-5 text-center text-sm text-zinc-400">
          لا توجد تعليقات بعد، كن أول من يعلّق
        </p>
      )}
    </div>
  );
}
