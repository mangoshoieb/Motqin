import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorCodeMessage } from "./error-codes";
import { getCodedApiError, isAuthGateError } from "./api-error";
import { QUOTE_TODAY_QUERY_KEY } from "../hooks/useTodayQuote";

const FALLBACK = "تعذر إتمام العملية، حاول مرة أخرى";

// Codes that mean the card is showing something that's gone — refetch it.
const STALE_CODES = ["comment_not_found", "quote_not_found", "parent_comment_deleted"];

export const quoteErrorCode = (error: unknown) => getCodedApiError(error)?.code;

/**
 * Toast for a failed quote comment/reaction call, from its error code
 * (Quote Front Guide item 2). The signup popup already covers guests.
 */
export function toastQuoteError(error: unknown, queryClient: QueryClient) {
  if (isAuthGateError(error)) return;
  const code = quoteErrorCode(error);
  toast.error(errorCodeMessage(code) ?? FALLBACK);
  if (code && STALE_CODES.includes(code)) {
    void queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });
  }
}
