import axiosInstance from "../lib/axios";
import { BLOCKER_ROUTES as R } from "../constants/distraction-blocker.constants";
import {
  BlockerSettings,
  BlockerSettingsInput,
  BlockerUnlockState,
  BlockSchedule,
  BlockScheduleInput,
} from "../types/distraction-blocker.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === "object" && "data" in body && "success" in body
    ? (body as ApiEnvelope<T>).data
    : (body as T);

const get = async <T>(url: string) =>
  unwrap<T>((await axiosInstance.get<ApiEnvelope<T> | T>(url)).data);

const post = async <T>(url: string, body?: unknown) =>
  unwrap<T>((await axiosInstance.post<ApiEnvelope<T> | T>(url, body ?? {})).data);

const put = async <T>(url: string, body: unknown) =>
  unwrap<T>((await axiosInstance.put<ApiEnvelope<T> | T>(url, body)).data);

export const distractionBlockerService = {
  // A student who never saved any gets the defaults.
  getSettings: () => get<BlockerSettings>(R.SETTINGS),

  // All fields at once. Refused while a block runs on the phone, and while a
  // mentor holds the lock. Websites come back as bare hosts.
  updateSettings: (input: BlockerSettingsInput) => put<BlockerSettings>(R.SETTINGS, input),

  // Oldest first, switched-off ones included.
  listSchedules: async () => {
    const schedules = await get<BlockSchedule[]>(R.SCHEDULES);
    return Array.isArray(schedules) ? schedules : [];
  },

  // Never refused by the lock or a running block — it only adds blocking.
  createSchedule: (input: BlockScheduleInput) => post<BlockSchedule>(R.SCHEDULES, input),

  updateSchedule: (id: number, input: BlockScheduleInput) =>
    put<BlockSchedule>(R.SCHEDULE(id), input),

  deleteSchedule: async (id: number) => {
    await axiosInstance.delete(R.SCHEDULE(id));
  },

  // Asking again within 10 minutes keeps the same code.
  requestUnlockCode: () => post<BlockerUnlockState>(R.UNLOCK_REQUEST),

  verifyUnlockCode: (code: string) => post<BlockerUnlockState>(R.UNLOCK_VERIFY, { code }),
};
