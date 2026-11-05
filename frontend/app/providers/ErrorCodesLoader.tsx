"use client";

import { useQuery } from "@tanstack/react-query";
import { lookupsService } from "@/app/services/lookups.service";
import { setErrorCatalogue } from "@/app/lib/error-codes";

const DAY = 24 * 60 * 60 * 1000;

// Fetches the Arabic error catalogue once per session (it's an open
// endpoint) and hands it to getApiErrorMessage. Renders nothing.
export default function ErrorCodesLoader() {
  useQuery({
    queryKey: ["lookups", "error-codes"],
    queryFn: async () => {
      const items = await lookupsService.errorCodes();
      if (items.length) setErrorCatalogue(items);
      return items;
    },
    staleTime: DAY,
    gcTime: DAY,
    retry: 1,
  });
  return null;
}
