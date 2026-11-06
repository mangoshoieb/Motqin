import axiosInstance from "../lib/axios";
import { ADMIN_PAYMENT_ROUTES as R } from "../constants/payment.constants";
import {
  AdminUser,
  Bundle,
  BundleFeatureInput,
  CatalogueReport,
  Coupon,
  CouponQuery,
  CouponUsage,
  FeatureCatalogueItem,
  Paged,
  Partner,
  PartnerReport,
  PaymentMismatch,
  SaveBundleBody,
  SaveCouponBody,
  SavePartnerBody,
  UserRole,
  VoucherBatch,
  VoucherBatchBody,
} from "../types/payment.types";
import { unwrap } from "./payment.service";

const get = async <T>(url: string, params?: object) => unwrap<T>((await axiosInstance.get(url, { params })).data);
const post = async <T>(url: string, body?: unknown, params?: object) =>
  unwrap<T>((await axiosInstance.post(url, body, { params })).data);
const put = async <T>(url: string, body?: unknown) => unwrap<T>((await axiosInstance.put(url, body)).data);
const list = <T>(value: T[] | null | undefined) => (Array.isArray(value) ? value : []);

// Manager and Admin accounts only; anyone else gets 403 with an empty body.
export const adminPaymentService = {
  // --- Plans ---
  listBundles: async () => list(await get<Bundle[]>(R.BUNDLES)),
  listFeatures: async () => list(await get<FeatureCatalogueItem[]>(R.FEATURES)),
  createBundle: (body: SaveBundleBody) => post<Bundle>(R.BUNDLES, body),
  updateBundle: (id: number, body: SaveBundleBody) => put<Bundle>(R.BUNDLE(id), body),
  setBundleFeatures: (id: number, features: BundleFeatureInput[]) => put<Bundle>(R.BUNDLE_FEATURES(id), features),
  deactivateBundle: (id: number) => post<{ id: number; isActive: boolean }>(R.DEACTIVATE_BUNDLE(id)),
  applyCatalogue: (dryRun: boolean, retireOthers: boolean) =>
    post<CatalogueReport>(R.APPLY_CATALOGUE, undefined, { dryRun, retireOthers }),

  // --- Coupons and vouchers ---
  listCoupons: (query: CouponQuery) => get<Paged<Coupon>>(R.COUPONS, query),
  createCoupon: (body: SaveCouponBody) => post<Coupon>(R.COUPONS, body),
  updateCoupon: (id: number, body: SaveCouponBody) => put<Coupon>(R.COUPON(id), body),
  couponUsage: (id: number) => get<CouponUsage>(R.COUPON_USAGE(id)),
  createBatch: (body: VoucherBatchBody) => post<VoucherBatch>(R.BATCHES, body),
  batchUsage: (id: number) => get<CouponUsage>(R.BATCH_USAGE(id)),

  // --- Partners ---
  listPartners: async () => list(await get<Partner[]>(R.PARTNERS)),
  createPartner: (body: SavePartnerBody) => post<Partner>(R.PARTNERS, body),
  updatePartner: (id: number, body: SavePartnerBody) => put<Partner>(R.PARTNER(id), body),
  linkPartnerUser: (id: number, phoneNumber: string) => put<Partner>(R.PARTNER_USER(id), { phoneNumber }),
  partnerReport: (id: number, from?: string, to?: string) =>
    get<PartnerReport>(R.PARTNER_REPORT(id), { ...(from ? { from } : {}), ...(to ? { to } : {}) }),

  // --- Payments ---
  listMismatches: async () => list(await get<PaymentMismatch[]>(R.MISMATCHES)),

  // --- Admins and roles (Admin only) ---
  listAdmins: async () => list(await get<AdminUser[]>(R.ADMINS)),
  grantAdmin: (phoneNumber: string) => post<AdminUser>(R.ADMINS, { phoneNumber }),
  revokeAdmin: async (userId: string) => {
    await axiosInstance.delete(R.ADMIN(userId));
  },
  setRole: (userId: string, role: UserRole) => put<AdminUser>(R.USER_ROLE(userId), { role }),
};
