import axiosInstance from "../lib/axios";
import { PAYMENT_ROUTES as R } from "../constants/payment.constants";
import {
  Bundle,
  BundleAudience,
  MySubscription,
  Paged,
  PartnerReport,
  PurchasePreview,
  PurchaseResult,
  Recharge,
  RechargeStart,
  UserSubscription,
  Wallet,
  WalletTransaction,
} from "../types/payment.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// Payment endpoints answer { success, data, error }.
export const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === "object" && "data" in body && "success" in body
    ? (body as ApiEnvelope<T>).data
    : (body as T);

const get = async <T>(url: string, params?: object) =>
  unwrap<T>((await axiosInstance.get<ApiEnvelope<T> | T>(url, { params })).data);

const post = async <T>(url: string, body?: unknown) =>
  unwrap<T>((await axiosInstance.post<ApiEnvelope<T> | T>(url, body)).data);

const list = <T>(value: T[] | null | undefined) => (Array.isArray(value) ? value : []);

export const paymentService = {
  // --- Plans ---
  listBundles: async (audience?: BundleAudience) =>
    list(await get<Bundle[]>(R.BUNDLES, audience ? { audience } : undefined)),
  getBundle: (id: number) => get<Bundle>(R.BUNDLE(id)),

  // --- Wallet ---
  getWallet: () => get<Wallet>(R.WALLET),
  listTransactions: (page: number, pageSize: number) =>
    get<Paged<WalletTransaction>>(R.WALLET_TRANSACTIONS, { page, pageSize }),
  startRecharge: (amount: number) => post<RechargeStart>(R.RECHARGE, { amount }),
  getRecharge: (reference: string) => get<Recharge>(R.RECHARGE_STATUS(reference)),

  // --- Subscription ---
  getMySubscription: () => get<MySubscription>(R.MY_SUBSCRIPTION),
  listHistory: async () => list(await get<UserSubscription[]>(R.SUBSCRIPTION_HISTORY)),
  preview: (bundleId: number, couponCode: string | null) =>
    post<PurchasePreview>(R.PREVIEW, { bundleId, couponCode: couponCode || null }),
  purchase: (bundleId: number, couponCode: string | null) =>
    post<PurchaseResult>(R.PURCHASE, { bundleId, couponCode: couponCode || null }),

  // --- Partner dashboard ---
  getMyPartnerReport: (from?: string, to?: string) =>
    get<PartnerReport>(R.MY_PARTNER, { ...(from ? { from } : {}), ...(to ? { to } : {}) }),
};
