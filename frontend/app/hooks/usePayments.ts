"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { paymentService as api } from "@/app/services/payment.service";
import {
  RECHARGE_FAST_POLL_FOR_MS,
  RECHARGE_POLL_MS,
  RECHARGE_SLOW_POLL_MS,
  WALLET_PAGE_SIZE,
} from "@/app/constants/payment.constants";
import { BundleAudience } from "@/app/types/payment.types";
import { getApiErrorStatus } from "@/app/lib/api-error";

export const PAYMENT_KEYS = {
  bundles: (audience: BundleAudience) => ["payments", "bundles", audience] as const,
  bundle: (id: number) => ["payments", "bundle", id] as const,
  wallet: ["payments", "wallet"] as const,
  transactions: (page: number, pageSize: number) => ["payments", "wallet", "transactions", page, pageSize] as const,
  recharge: (reference: string) => ["payments", "recharge", reference] as const,
  subscription: ["payments", "subscription"] as const,
  history: ["payments", "subscription", "history"] as const,
  preview: (bundleId: number, coupon: string, groups: string) => ["payments", "preview", bundleId, coupon, groups] as const,
  transactionsAll: ["payments", "wallet", "transactions", "all"] as const,
  partner: (from: string, to: string) => ["payments", "partner", from, to] as const,
};

// --- Plans ---------------------------------------------------------------------

export const useBundles = (audience: BundleAudience) =>
  useQuery({
    queryKey: PAYMENT_KEYS.bundles(audience),
    queryFn: () => api.listBundles(audience),
    staleTime: 10 * 60_000,
  });

export const useBundle = (id: number | null | undefined) =>
  useQuery({
    queryKey: PAYMENT_KEYS.bundle(id ?? 0),
    queryFn: () => api.getBundle(id!),
    enabled: !!id,
    staleTime: 10 * 60_000,
    retry: false,
  });

// --- Wallet ----------------------------------------------------------------------

// Registered accounts only — a guest's call would pop the signup dialog.
export const useWallet = (enabled: boolean) =>
  useQuery({ queryKey: PAYMENT_KEYS.wallet, queryFn: api.getWallet, enabled });

export const useTransactions = (page: number, enabled: boolean, pageSize = WALLET_PAGE_SIZE) =>
  useQuery({
    queryKey: PAYMENT_KEYS.transactions(page, pageSize),
    queryFn: () => api.listTransactions(page, pageSize),
    enabled,
    placeholderData: keepPreviousData,
  });

// The whole wallet history, a page at a time ("عرض المزيد").
export const useAllTransactions = (enabled: boolean) =>
  useInfiniteQuery({
    queryKey: PAYMENT_KEYS.transactionsAll,
    queryFn: ({ pageParam }) => api.listTransactions(pageParam, WALLET_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    enabled,
  });

// Errors are shown inside the top-up dialog.
export const useStartRecharge = () => useMutation({ mutationFn: api.startRecharge });

// Where a top-up stands — the only way to learn the money arrived. Polled
// quickly for the first minutes while pending, then more slowly.
export const useRecharge = (reference: string | null, startedAt: number) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: PAYMENT_KEYS.recharge(reference ?? ""),
    queryFn: async () => {
      const recharge = await api.getRecharge(reference!);
      if (recharge.status === "Succeeded") {
        void queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.wallet });
        void queryClient.invalidateQueries({ queryKey: ["payments", "preview"] });
      }
      return recharge;
    },
    enabled: !!reference,
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== "Pending"
        ? false
        : Date.now() - startedAt < RECHARGE_FAST_POLL_FOR_MS
          ? RECHARGE_POLL_MS
          : RECHARGE_SLOW_POLL_MS,
    refetchIntervalInBackground: true,
  });
};

// --- Subscription --------------------------------------------------------------------

export const useMySubscription = (enabled = true) =>
  useQuery({ queryKey: PAYMENT_KEYS.subscription, queryFn: api.getMySubscription, enabled });

export const useSubscriptionHistory = (enabled: boolean) =>
  useQuery({ queryKey: PAYMENT_KEYS.history, queryFn: api.listHistory, enabled });

// Saves nothing, so it's read like a query; re-run with each coupon tried
// and each change of the kept main features.
export const usePurchasePreview = (
  bundleId: number | null,
  coupon: string,
  groups: string[] | null,
  enabled: boolean,
) =>
  useQuery({
    queryKey: PAYMENT_KEYS.preview(bundleId ?? 0, coupon, groups?.join(",") ?? ""),
    queryFn: () => api.preview(bundleId!, coupon || null, groups),
    enabled: enabled && !!bundleId,
    placeholderData: keepPreviousData,
  });

export const usePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bundleId, coupon, groups }: { bundleId: number; coupon: string | null; groups: string[] | null }) =>
      api.purchase(bundleId, coupon, groups),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });
};

// --- Partner dashboard ---------------------------------------------------------------

// 404 not_a_partner means "hide the dashboard", not an error.
export const useMyPartnerReport = (from: string, to: string, enabled: boolean) =>
  useQuery({
    queryKey: PAYMENT_KEYS.partner(from, to),
    queryFn: async () => {
      try {
        return await api.getMyPartnerReport(from || undefined, to || undefined);
      } catch (error) {
        if (getApiErrorStatus(error) === 404 || getApiErrorStatus(error) === 403) return null;
        throw error;
      }
    },
    enabled,
    retry: false,
    placeholderData: keepPreviousData,
  });
