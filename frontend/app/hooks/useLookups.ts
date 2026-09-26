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

export function useEgyptianGovernorates() {
  return useQuery({
    queryKey: ["lookups", "egyptian-governorates"],
    queryFn: () => lookupsService.egyptianGovernorates(),
    ...STATIC,
  });
}
