import axiosInstance from "@/app/lib/axios";
import { API_ROUTES } from "@/app/constants/planner.constants";
import { QUESTION_API_ROUTES } from "@/app/constants/question.constants";
import { CountryLookupItem, ErrorCodeItem, LookupItem } from "@/app/types/lookup.types";
import {
  AssistantPermissionItem,
  PerformanceFlagsLookup,
} from "@/app/types/tracking-table.types";

// The lookup endpoints are open (no auth) and return a bare array.
export const lookupsService = {
  async countries(): Promise<CountryLookupItem[]> {
    const { data } = await axiosInstance.get<CountryLookupItem[]>(
      API_ROUTES.LOOKUPS.COUNTRIES,
    );
    return Array.isArray(data) ? data : [];
  },

  async egyptianGovernorates(): Promise<LookupItem[]> {
    const { data } = await axiosInstance.get<LookupItem[]>(
      API_ROUTES.LOOKUPS.EGYPTIAN_GOVERNORATES,
    );
    return Array.isArray(data) ? data : [];
  },

  // The Arabic message for every error code the API sends.
  async errorCodes(): Promise<ErrorCodeItem[]> {
    const { data } = await axiosInstance.get<ErrorCodeItem[]>(API_ROUTES.LOOKUPS.ERROR_CODES);
    return Array.isArray(data) ? data : [];
  },

  // The 10 assistant permissions, in display order.
  async assistantPermissions(): Promise<AssistantPermissionItem[]> {
    const { data } = await axiosInstance.get<AssistantPermissionItem[]>(
      API_ROUTES.LOOKUPS.ASSISTANT_PERMISSIONS,
    );
    return Array.isArray(data) ? data : [];
  },

  async performanceFlags(): Promise<PerformanceFlagsLookup | null> {
    const { data } = await axiosInstance.get<PerformanceFlagsLookup>(
      API_ROUTES.LOOKUPS.PERFORMANCE_FLAGS,
    );
    return data && Array.isArray(data.flags) ? data : null;
  },

  // The blocker schedule's day picker, Saturday first.
  async weekDays(): Promise<LookupItem[]> {
    const { data } = await axiosInstance.get<LookupItem[]>(API_ROUTES.LOOKUPS.WEEK_DAYS);
    return Array.isArray(data) ? data : [];
  },

  // The Language choices for AI question generation (0 = auto).
  async informationLanguages(): Promise<LookupItem[]> {
    const { data } = await axiosInstance.get<LookupItem[]>(
      QUESTION_API_ROUTES.INFORMATION_LANGUAGES,
    );
    return Array.isArray(data) ? data : [];
  },
};
