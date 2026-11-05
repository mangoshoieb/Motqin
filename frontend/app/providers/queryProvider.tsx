"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { apiErrorCode } from "@/app/lib/tracking-table";

interface Props {
  children: ReactNode;
}

// An assistant meets these when the teacher changes their access mid-visit
// (a permission taken away, a table unshared). The table list carries each
// table's permissions, so re-read it and the buttons follow.
const ACCESS_CHANGED_CODES = ["assistant_permission_missing", "table_not_found"];

export default function QueryProvider({ children }: Props) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({ onError: (error) => refreshAccess(error) }),
      mutationCache: new MutationCache({ onError: (error) => refreshAccess(error) }),
    });
    const refreshAccess = (error: unknown) => {
      if (ACCESS_CHANGED_CODES.includes(apiErrorCode(error) ?? "")) {
        void client.invalidateQueries({ queryKey: ["tracking-tables", "list"] });
      }
    };
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
