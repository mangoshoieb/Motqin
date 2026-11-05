"use client";

import { useQuery } from "@tanstack/react-query";
import { lookupsService } from "@/app/services/lookups.service";
import { setAssistantPermissions } from "@/app/lib/assistant-permissions";
import {
  ASSISTANT_PERMISSIONS_FALLBACK,
  PERFORMANCE_FLAGS_FALLBACK,
} from "@/app/constants/tracking-table.constants";

// Reference data that only changes when the backend ships a new list, so it
// is fetched once and kept for the session.
const STATIC = { staleTime: 24 * 60 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000 };

export function useCountries() {
  return useQuery({
    queryKey: ["lookups", "countries"],
    queryFn: () => lookupsService.countries(),
    ...STATIC,
  });
}

export function useInformationLanguages() {
  return useQuery({
    queryKey: ["lookups", "information-languages"],
    queryFn: () => lookupsService.informationLanguages(),
    ...STATIC,
  });
}

// The assistant form's checkboxes and the permission chips. Falls back to the
// guide's copy while loading, or where the server doesn't have it yet.
export function useAssistantPermissions() {
  const { data } = useQuery({
    queryKey: ["lookups", "assistant-permissions"],
    queryFn: async () => {
      const items = await lookupsService.assistantPermissions();
      setAssistantPermissions(items);
      return items;
    },
    retry: false,
    ...STATIC,
  });
  return data?.length ? data : ASSISTANT_PERMISSIONS_FALLBACK;
}

export function usePerformanceFlags() {
  const { data } = useQuery({
    queryKey: ["lookups", "performance-flags"],
    queryFn: () => lookupsService.performanceFlags(),
    retry: false,
    ...STATIC,
  });
  return data ?? PERFORMANCE_FLAGS_FALLBACK;
}

// Callers fall back to WEEK_DAYS_FALLBACK while this loads or if it fails,
// so retrying only adds noise (it 404s on the demo server as of 2026-11-01).
export function useWeekDays() {
  return useQuery({
    queryKey: ["lookups", "week-days"],
    queryFn: () => lookupsService.weekDays(),
    retry: false,
    ...STATIC,
  });
}

export function useEgyptianGovernorates() {
  return useQuery({
    queryKey: ["lookups", "egyptian-governorates"],
    queryFn: () => lookupsService.egyptianGovernorates(),
    ...STATIC,
  });
}
