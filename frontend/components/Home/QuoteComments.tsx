"use client";

import { useState } from "react";
import { Flag, Pencil, Send, Trash2, X } from "lucide-react";
import { QuoteComment } from "@/app/types/quote.types";
import { useAuth } from "@/app/(public)/context/auth.context";
import {
  useAddQuoteComment,
  useDeleteQuoteComment,
  useReportQuoteComment,
  useUpdateQuoteComment,
} from "@/app/hooks/useQuoteComment";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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

function CommentItem({ comment }: { comment: QuoteComment }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { mutate: updateComment, isPending: isUpdating } = useUpdateQuoteComment();
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteQuoteComment();
  const { mutate: reportComment } = useReportQuoteComment();

  const isOwnComment = !!user && comment.userId === user.id;
  const displayName = comment.userName || "مستخدم";

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
        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColorFor(
          displayName
        )}`}
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
          ) : (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-zinc-300">
              {comment.content}
            </p>
          )}
        </div>

        {!isEditing && (
          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-zinc-400">
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
              <button
                type="button"
                onClick={() => reportComment({ commentId: comment.id, reason: "محتوى غير لائق" })}
                className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400"
              >
                <Flag size={12} /> إبلاغ
              </button>
            )}
          </div>
        )}
      </div>

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
  const { mutate: addComment, isPending } = useAddQuoteComment();

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
      <h3 className="mb-4 text-sm font-bold text-zinc-700 dark:text-zinc-300">
        التعليقات ({comments.length})
      </h3>

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

      {comments.length > 0 ? (
        <div className="mt-5 max-h-80 space-y-4 overflow-y-auto pe-1">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="mt-5 text-center text-sm text-zinc-400">
          لا توجد تعليقات بعد، كن أول من يعلّق
        </p>
      )}
    </div>
  );
}
