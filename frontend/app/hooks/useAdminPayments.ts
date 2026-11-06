"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminPaymentService as api } from "@/app/services/admin-payment.service";
import { toastApiError } from "@/app/lib/api-error";
import {
  BundleFeatureInput,
  CouponQuery,
  SaveBundleBody,
  SaveCouponBody,
  SavePartnerBody,
  UserRole,
  VoucherBatchBody,
} from "@/app/types/payment.types";

export const ADMIN_KEYS = {
  bundles: ["admin", "bundles"] as const,
  features: ["admin", "features"] as const,
  coupons: (query: CouponQuery) => ["admin", "coupons", query] as const,
  couponUsage: (kind: "coupon" | "batch", id: number) => ["admin", "coupon-usage", kind, id] as const,
  partners: ["admin", "partners"] as const,
  partnerReport: (id: number, from: string, to: string) => ["admin", "partner-report", id, from, to] as const,
  mismatches: ["admin", "mismatches"] as const,
  admins: ["admin", "admins"] as const,
};

// Errors on saves stay in the dialogs, next to the fields they're about.

// --- Plans ---------------------------------------------------------------------

export const useAdminBundles = () => useQuery({ queryKey: ADMIN_KEYS.bundles, queryFn: api.listBundles });

export const useFeatureCatalogue = () =>
  useQuery({ queryKey: ADMIN_KEYS.features, queryFn: api.listFeatures, staleTime: 30 * 60_000 });

const useInvalidate = (key: readonly unknown[]) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: key });
};

export const useSaveBundle = () => {
  const invalidate = useInvalidate(["admin", "bundles"]);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: SaveBundleBody }) =>
      id ? api.updateBundle(id, body) : api.createBundle(body),
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["payments", "bundles"] });
    },
  });
};

export const useSetBundleFeatures = () => {
  const invalidate = useInvalidate(["admin", "bundles"]);
  return useMutation({
    mutationFn: ({ id, features }: { id: number; features: BundleFeatureInput[] }) =>
      api.setBundleFeatures(id, features),
    onSuccess: invalidate,
  });
};

export const useDeactivateBundle = () => {
  const invalidate = useInvalidate(["admin", "bundles"]);
  return useMutation({
    mutationFn: api.deactivateBundle,
    onSuccess: invalidate,
    onError: (error) => toastApiError("تعذر إيقاف بيع الباقة", error),
  });
};

export const useApplyCatalogue = () => {
  const invalidate = useInvalidate(["admin", "bundles"]);
  return useMutation({
    mutationFn: ({ dryRun, retireOthers }: { dryRun: boolean; retireOthers: boolean }) =>
      api.applyCatalogue(dryRun, retireOthers),
    onSuccess: (_report, { dryRun }) => {
      if (!dryRun) void invalidate();
    },
  });
};

// --- Coupons -------------------------------------------------------------------

export const useAdminCoupons = (query: CouponQuery) =>
  useQuery({
    queryKey: ADMIN_KEYS.coupons(query),
    queryFn: () => api.listCoupons(query),
    placeholderData: keepPreviousData,
  });

export const useSaveCoupon = () => {
  const invalidate = useInvalidate(["admin", "coupons"]);
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: SaveCouponBody }) =>
      id ? api.updateCoupon(id, body) : api.createCoupon(body),
    onSuccess: invalidate,
  });
};

export const useCreateBatch = () => {
  const invalidate = useInvalidate(["admin", "coupons"]);
  return useMutation({ mutationFn: (body: VoucherBatchBody) => api.createBatch(body), onSuccess: invalidate });
};

export const useCouponUsage = (kind: "coupon" | "batch", id: number | null) =>
  useQuery({
    queryKey: ADMIN_KEYS.couponUsage(kind, id ?? 0),
    queryFn: () => (kind === "coupon" ? api.couponUsage(id!) : api.batchUsage(id!)),
    enabled: !!id,
  });

// --- Partners ------------------------------------------------------------------

export const useAdminPartners = () => useQuery({ queryKey: ADMIN_KEYS.partners, queryFn: api.listPartners });

export const useSavePartner = () => {
  const invalidate = useInvalidate(ADMIN_KEYS.partners);
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: SavePartnerBody }) =>
      id ? api.updatePartner(id, body) : api.createPartner(body),
    onSuccess: invalidate,
  });
};

export const useLinkPartnerUser = () => {
  const invalidate = useInvalidate(ADMIN_KEYS.partners);
  return useMutation({
    mutationFn: ({ id, phoneNumber }: { id: number; phoneNumber: string }) => api.linkPartnerUser(id, phoneNumber),
    onSuccess: invalidate,
  });
};

export const usePartnerReport = (id: number | null, from: string, to: string) =>
  useQuery({
    queryKey: ADMIN_KEYS.partnerReport(id ?? 0, from, to),
    queryFn: () => api.partnerReport(id!, from || undefined, to || undefined),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

// --- Payments and admins ---------------------------------------------------------

export const usePaymentMismatches = () => useQuery({ queryKey: ADMIN_KEYS.mismatches, queryFn: api.listMismatches });

export const useAdmins = (enabled: boolean) =>
  useQuery({ queryKey: ADMIN_KEYS.admins, queryFn: api.listAdmins, enabled });

export const useGrantAdmin = () => {
  const invalidate = useInvalidate(ADMIN_KEYS.admins);
  return useMutation({ mutationFn: api.grantAdmin, onSuccess: invalidate });
};

export const useRevokeAdmin = () => {
  const invalidate = useInvalidate(ADMIN_KEYS.admins);
  return useMutation({
    mutationFn: api.revokeAdmin,
    onSuccess: invalidate,
    onError: (error) => toastApiError("تعذر إزالة صلاحية المدير", error),
  });
};

export const useSetUserRole = () => {
  const invalidate = useInvalidate(ADMIN_KEYS.admins);
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => api.setRole(userId, role),
    onSuccess: invalidate,
  });
};
