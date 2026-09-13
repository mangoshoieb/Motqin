"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";

import { authStorage } from "../lib/auth-storage";
import { DailyQuote, QuoteComment, QuoteReactionUser, ReactionType } from "../types/quote.types";
import { QUOTE_TODAY_QUERY_KEY } from "./useTodayQuote";
import { applyReaction, quoteReactionsKey, removeUserReaction } from "./useQuoteReaction";

// The hub lives next to the REST API: NEXT_PUBLIC_BASE_URL is ".../api", the
// hub is ".../quoteHub".
const HUB_URL = `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/api\/?$/, "")}/quoteHub`;

// Server → client events (see "What the frontend needs from back" hand-over).
const EVENTS = {
  comment: "ReceiveComment",
  commentUpdate: "ReceiveCommentUpdate",
  commentDelete: "ReceiveCommentDelete",
  reaction: "ReceiveReaction",
  reactionRemoved: "ReceiveReactionRemoved",
  quoteScheduled: "ReceiveQuoteScheduled",
  quoteUpdated: "ReceiveQuoteUpdated",
  quoteDeleted: "ReceiveQuoteDeleted",
} as const;

interface CommentDeletePayload {
  commentId: number;
  quoteId: number;
}
interface ReactionPayload {
  quoteId: number;
  userId: string;
  reactionType: ReactionType;
}
interface ReactionRemovedPayload {
  quoteId: number;
  userId: string;
}

// ---- pure cache helpers -------------------------------------------------

const upsertComment = (list: QuoteComment[], incoming: QuoteComment): QuoteComment[] => {
  // Top-level comment.
  if (!incoming.parentCommentId) {
    return list.some((c) => c.id === incoming.id)
      ? list.map((c) => (c.id === incoming.id ? { ...c, ...incoming } : c))
      : [...list, incoming];
  }
  // Reply: nest under its parent (one level, matching CommentRenderDto).
  return list.map((c) =>
    c.id === incoming.parentCommentId
      ? {
          ...c,
          replies: (c.replies ?? []).some((r) => r.id === incoming.id)
            ? (c.replies ?? []).map((r) => (r.id === incoming.id ? { ...r, ...incoming } : r))
            : [...(c.replies ?? []), incoming],
        }
      : c,
  );
};

const patchComment = (list: QuoteComment[], incoming: QuoteComment): QuoteComment[] =>
  list.map((c) =>
    c.id === incoming.id
      ? { ...c, content: incoming.content, isDeletedByAdmin: incoming.isDeletedByAdmin }
      : { ...c, replies: c.replies ? patchComment(c.replies, incoming) : c.replies },
  );

const removeComment = (list: QuoteComment[], commentId: number): QuoteComment[] =>
  list
    .filter((c) => c.id !== commentId)
    .map((c) => (c.replies ? { ...c, replies: removeComment(c.replies, commentId) } : c));

/**
 * Keeps today's quote live: joins the SignalR room for `quoteId` and folds
 * every broadcast into the ["quote","today"] cache, so reactions and
 * comments from other users show up without a refresh.
 *
 * `currentUserId` is used to drop the echo of our own actions — the HTTP
 * response already updated the cache for those.
 */
export function useQuoteHub(quoteId: number | null | undefined, currentUserId?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!quoteId || typeof window === "undefined") return;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // Re-read on every (re)connect so a refreshed token is what gets sent.
        accessTokenFactory: () => authStorage.getAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const setToday = (updater: (prev: DailyQuote) => DailyQuote) =>
      queryClient.setQueryData<DailyQuote>(QUOTE_TODAY_QUERY_KEY, (prev) =>
        prev ? updater(prev) : prev,
      );
    const refetchToday = () =>
      queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });

    // Handlers go on BEFORE start() so nothing early is missed.
    connection.on(EVENTS.comment, (comment: QuoteComment) => {
      if (comment.quoteId !== quoteId) return;
      setToday((prev) => ({ ...prev, comments: upsertComment(prev.comments ?? [], comment) }));
    });

    connection.on(EVENTS.commentUpdate, (comment: QuoteComment) => {
      if (comment.quoteId !== quoteId) return;
      setToday((prev) => ({ ...prev, comments: patchComment(prev.comments ?? [], comment) }));
    });

    connection.on(EVENTS.commentDelete, ({ commentId, quoteId: id }: CommentDeletePayload) => {
      if (id !== quoteId) return;
      setToday((prev) => ({ ...prev, comments: removeComment(prev.comments ?? [], commentId) }));
    });

    // Reactions: the list holds one row per user, so the event is enough to
    // update it in place (per-type counts are derived from that list). Our
    // own echo is skipped — the mutation already applied it optimistically.
    const reactionsKey = quoteReactionsKey(quoteId);
    const setReactions = (updater: (prev: QuoteReactionUser[] | undefined) => QuoteReactionUser[]) =>
      queryClient.setQueryData<QuoteReactionUser[]>(reactionsKey, updater);

    connection.on(EVENTS.reaction, ({ quoteId: id, userId, reactionType }: ReactionPayload) => {
      if (id !== quoteId || (currentUserId && userId === currentUserId)) return;
      setReactions((prev) => applyReaction(prev, quoteId, userId, reactionType));
    });

    connection.on(EVENTS.reactionRemoved, ({ quoteId: id, userId }: ReactionRemovedPayload) => {
      if (id !== quoteId || (currentUserId && userId === currentUserId)) return;
      setReactions((prev) => removeUserReaction(prev, userId));
    });

    connection.on(EVENTS.quoteUpdated, () => refetchToday());
    connection.on(EVENTS.quoteDeleted, () => refetchToday());
    connection.on(EVENTS.quoteScheduled, () => refetchToday());

    const join = () => connection.invoke("JoinQuoteRoom", quoteId).catch(() => {});

    // Groups aren't restored by SignalR after a reconnect — join again.
    connection.onreconnected(() => {
      void join();
      // Anything broadcast while we were away is gone; resync once.
      refetchToday();
      queryClient.invalidateQueries({ queryKey: reactionsKey });
    });

    let cancelled = false;
    connection
      .start()
      .then(() => {
        if (!cancelled) return join();
      })
      .catch((error) => {
        console.warn("quoteHub: could not connect", error);
      });

    return () => {
      cancelled = true;
      const stop = () => connection.stop().catch(() => {});
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke("LeaveQuoteRoom", quoteId).catch(() => {}).finally(stop);
      } else {
        void stop();
      }
    };
  }, [quoteId, currentUserId, queryClient]);
}
