import { QuoteComment } from "@/app/types/quote.types";

// Depth-agnostic helpers for the comment tree. The API's CommentRenderDto
// nests replies under `replies`, and a reply can itself have replies, so
// every operation here walks the whole tree rather than one level.

/** Insert or update `incoming` under its parent, wherever that parent is. */
export const insertComment = (list: QuoteComment[], incoming: QuoteComment): QuoteComment[] => {
  if (!incoming.parentCommentId) {
    return list.some((c) => c.id === incoming.id)
      ? list.map((c) => (c.id === incoming.id ? { ...c, ...incoming, replies: c.replies } : c))
      : [...list, incoming];
  }

  let placed = false;
  const walk = (nodes: QuoteComment[]): QuoteComment[] =>
    nodes.map((node) => {
      if (node.id === incoming.parentCommentId) {
        placed = true;
        const replies = node.replies ?? [];
        return {
          ...node,
          replies: replies.some((r) => r.id === incoming.id)
            ? replies.map((r) => (r.id === incoming.id ? { ...r, ...incoming, replies: r.replies } : r))
            : [...replies, incoming],
        };
      }
      return node.replies?.length ? { ...node, replies: walk(node.replies) } : node;
    });

  const next = walk(list);
  // Parent not loaded (e.g. it arrived out of order): keep the comment
  // visible at the top level rather than losing it.
  return placed ? next : [...next, incoming];
};

export const patchComment = (list: QuoteComment[], incoming: QuoteComment): QuoteComment[] =>
  list.map((c) =>
    c.id === incoming.id
      ? { ...c, content: incoming.content, isDeletedByAdmin: incoming.isDeletedByAdmin }
      : c.replies?.length
        ? { ...c, replies: patchComment(c.replies, incoming) }
        : c,
  );

export const removeComment = (list: QuoteComment[], commentId: number): QuoteComment[] =>
  list
    .filter((c) => c.id !== commentId)
    .map((c) => (c.replies?.length ? { ...c, replies: removeComment(c.replies, commentId) } : c));

/**
 * Normalise whatever the API returned into a proper tree: comments that
 * came back flat (only `parentCommentId` set) are attached under their
 * parent at any depth; already-nested ones are kept.
 */
export const buildThread = (comments: QuoteComment[]): QuoteComment[] => {
  const flatReplies = comments.filter((c) => c.parentCommentId);
  if (flatReplies.length === 0) return comments;

  let tree = comments.filter((c) => !c.parentCommentId);
  // Insert in id order so parents are (almost always) placed before children.
  for (const reply of [...flatReplies].sort((a, b) => a.id - b.id)) {
    tree = insertComment(tree, reply);
  }
  return tree;
};

export const countAll = (comments: QuoteComment[]): number =>
  comments.reduce((sum, c) => sum + 1 + countAll(c.replies ?? []), 0);

export interface FlatReply {
  comment: QuoteComment;
  // Who this reply answers — undefined when it answers the root comment.
  replyingTo?: string;
}

/**
 * All descendants of `root` in reading order, flattened to one level for
 * display (the way Facebook shows deep threads) with the name being
 * answered so context isn't lost.
 */
export const flattenReplies = (root: QuoteComment): FlatReply[] => {
  const out: FlatReply[] = [];
  const walk = (parent: QuoteComment, isRoot: boolean) => {
    for (const reply of parent.replies ?? []) {
      out.push({ comment: reply, replyingTo: isRoot ? undefined : parent.userName || "مستخدم" });
      walk(reply, false);
    }
  };
  walk(root, true);
  return out;
};
