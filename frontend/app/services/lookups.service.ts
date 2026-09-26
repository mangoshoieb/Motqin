import axiosInstance from "@/app/lib/axios";
import { API_ROUTES } from "@/app/constants/planner.constants";
import { CountryLookupItem, LookupItem } from "@/app/types/lookup.types";

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
};
