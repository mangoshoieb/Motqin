"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CornerDownLeft, Flag, Flame, FlagOff, MessageCircle, Pencil, Reply, Send, ShieldOff, Trash2, X } from "lucide-react";
import { QuoteComment } from "@/app/types/quote.types";
import { useAuth } from "@/app/(public)/context/auth.context";
import {
  useAddQuoteComment,
  useDeleteQuoteComment,
  useUpdateQuoteComment,
} from "@/app/hooks/useQuoteComment";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { buildThread, countAll, flattenReplies } from "@/app/lib/quote-comments";
import { quoteErrorCode } from "@/app/lib/quote-errors";
import { shortName } from "@/app/lib/user";
import { momentMs } from "@/app/lib/date";
import UserAvatar from "@/components/ui/UserAvatar";
import ReportCommentDialog from "./ReportCommentDialog";

function timeAgo(isoDate: string) {
  const diffMs = Date.now() - (momentMs(isoDate) ?? Date.now());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}


// Collapsed, the card shows only the most popular comment; after "عرض كل
// التعليقات" about this many fit before the rest scroll inside the box.
const EXPANDED_COMMENTS = 5;

// The most popular top-level comment: the one with the most replies (at any
// depth), newest on a tie. Comments removed by an admin only win if nothing
// else is left.
function mostPopular(thread: QuoteComment[]): QuoteComment | undefined {
  const pool = thread.some((c) => !c.isDeletedByAdmin)
    ? thread.filter((c) => !c.isDeletedByAdmin)
    : thread;
  let best: QuoteComment | undefined;
  let bestReplies = -1;
  for (const comment of pool) {
    const replies = countAll(comment.replies ?? []);
    if (
      replies > bestReplies ||
      (replies === bestReplies && best && comment.createdAt > best.createdAt)
    ) {
      best = comment;
      bestReplies = replies;
    }
  }
  return best;
}

// Hard cap on a comment's length, enforced in the box and on submit.
export const COMMENT_MAX_CHARS = 300;
const COMMENT_MAX_ROWS = 3;

// One-line box that grows to COMMENT_MAX_ROWS as the user types, then
// scrolls — so long text wraps instead of sliding out of view. Enter
// submits, Shift+Enter inserts a newline, Escape cancels.
function CommentBox({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Fit height to content, capped at COMMENT_MAX_ROWS lines.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const padding = el.offsetHeight - el.clientHeight;
    const max = lineHeight * COMMENT_MAX_ROWS + padding;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [value]);

  const remaining = COMMENT_MAX_CHARS - value.length;

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={ref}
        rows={1}
        autoFocus={autoFocus}
        value={value}
        maxLength={COMMENT_MAX_CHARS}
        onChange={(e) => onChange(e.target.value.slice(0, COMMENT_MAX_CHARS))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
          if (e.key === "Escape") onCancel?.();
        }}
        placeholder={placeholder}
        className={`block w-full resize-none whitespace-pre-wrap break-words text-sm leading-5 text-zinc-900 outline-none dark:text-zinc-100 ${className}`}
      />
      {remaining <= 50 && (
        <span
          className={`pointer-events-none absolute bottom-1 left-3 text-[10px] tabular-nums ${
            remaining === 0 ? "text-red-500 dark:text-red-400" : "text-zinc-400"
          }`}
        >
          {remaining}
        </span>
      )}
    </div>
  );
}

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
    if (!content || content.length > COMMENT_MAX_CHARS) return;
    addComment(
      { quoteId, content, parentCommentId: parentId },
      {
        onSuccess: () => {
          setText("");
          onDone();
        },
        // The comment was deleted while the box was open: the hook already
        // toasted and refetched, so just close the box.
        onError: (error) => {
          if (quoteErrorCode(error) === "parent_comment_deleted") onDone();
        },
      },
    );
  };

  return (
    <div className="mt-2 flex items-end gap-2">
      <CornerDownLeft size={14} className="mb-2 shrink-0 text-zinc-300 dark:text-zinc-600" />
      <CommentBox
        autoFocus
        value={text}
        onChange={setText}
        onSubmit={submit}
        onCancel={onDone}
        placeholder={replyingTo ? `الرد على ${replyingTo}...` : "اكتب ردًا..."}
        className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !text.trim()}
        title="إرسال الرد"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
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
  isReply = false,
  replyingTo,
}: {
  comment: QuoteComment;
  quoteId: number;
  isReply?: boolean;
  // For a reply that answers another reply (not the root): whose name to
  // show, Facebook-style, since deep threads render at one indent.
  replyingTo?: string;
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
  // Own comments use the profile (full name + photo). Other users' come
  // from the comment DTO; the backend currently sends userName only.
  const displayName = isOwnComment
    ? shortName(user.fullName, shortName(comment.userName))
    : shortName(comment.userFullName ?? comment.userName);
  // The comment carries the commenter's photo as profilePictureUrl; own
  // comments prefer the live profile, which updates the moment it changes.
  const photoUrl = isOwnComment
    ? user.photoUrl ?? comment.profilePictureUrl
    : comment.profilePictureUrl ?? comment.userPhotoUrl;
  // Deep threads are flattened for display; the data stays truly nested.
  const replies = isReply ? [] : flattenReplies(comment);
  const removedByAdmin = Boolean(comment.isDeletedByAdmin);

  const handleSaveEdit = () => {
    const content = draft.trim();
    if (!content || content.length > COMMENT_MAX_CHARS || content === comment.content) {
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
      <UserAvatar name={displayName} photoUrl={photoUrl} size={isReply ? 28 : 36} />

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {displayName}
            </span>
            <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
          </div>

          {replyingTo && !isEditing && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
              <CornerDownLeft size={11} /> ردًا على {replyingTo}
            </p>
          )}

          {isEditing ? (
            <div className="mt-1.5 flex items-end gap-2">
              <CommentBox
                autoFocus
                value={draft}
                onChange={setDraft}
                onSubmit={handleSaveEdit}
                onCancel={() => {
                  setIsEditing(false);
                  setDraft(comment.content);
                }}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 dark:text-blue-400"
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
            parentId={comment.id}
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
                {replies.map(({ comment: reply, replyingTo: target }) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    quoteId={quoteId}
                    isReply
                    replyingTo={target}
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
          message={
            comment.replies?.length
              ? "سيتم حذف هذا التعليق وكل الردود عليه. لا يمكن التراجع عن هذا الإجراء."
              : "هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء."
          }
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
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = useRef(false);
  const { mutate: addComment, isPending } = useAddQuoteComment();
  const thread = buildThread(comments);
  const total = countAll(thread);
  const top = mostPopular(thread);
  const visible = expanded ? thread : top ? [top] : [];
  const canToggle = thread.length > 1;
  // Only call it "most popular" when it actually stands out.
  const showTopLabel = !expanded && canToggle && !!top?.replies?.length;

  // After posting, the new comment is at the end of the expanded list.
  useLayoutEffect(() => {
    if (!scrollToEnd.current || !listRef.current) return;
    scrollToEnd.current = false;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments, expanded]);

  const handleSubmit = () => {
    const content = newComment.trim();
    if (!content || content.length > COMMENT_MAX_CHARS) return;

    addComment(
      { quoteId, content },
      {
        onSuccess: () => {
          setNewComment("");
          // Show the whole list so the student sees their comment land.
          scrollToEnd.current = true;
          setExpanded(true);
        },
      }
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
        {canToggle && (
          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
            {expanded ? "عرض أقل" : "عرض الكل"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>

      <div className="flex items-end gap-2">
        <CommentBox
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmit}
          placeholder="اكتب تعليقًا..."
          className="rounded-2xl border border-zinc-200 bg-transparent px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:focus:ring-blue-950"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !newComment.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>

      {thread.length > 0 ? (
        <>
          {showTopLabel && (
            <p className="mt-5 flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
              <Flame size={12} className="text-orange-500 dark:text-orange-400" />
              التعليق الأكثر تفاعلًا
            </p>
          )}

          {/* Expanded: ~EXPANDED_COMMENTS rows tall, the rest scroll. */}
          <div
            ref={listRef}
            className={`${showTopLabel ? "mt-2" : "mt-5"} space-y-4 pe-1 ${expanded ? "overflow-y-auto" : ""}`}
            style={expanded ? { maxHeight: `${EXPANDED_COMMENTS * 5.6}rem` } : undefined}
          >
            {visible.map((comment) => (
              <CommentItem key={comment.id} comment={comment} quoteId={quoteId} />
            ))}
          </div>

          {canToggle && (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mx-auto mt-4 flex items-center gap-1 rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
            >
              {expanded ? (
                <>
                  <ChevronUp size={14} /> عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> عرض كل التعليقات ({thread.length})
                </>
              )}
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
