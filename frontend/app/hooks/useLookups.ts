"use client";

import { useQuery } from "@tanstack/react-query";
import { lookupsService } from "@/app/services/lookups.service";

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
