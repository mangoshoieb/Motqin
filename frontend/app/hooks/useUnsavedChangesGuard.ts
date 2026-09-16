"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Stops the user from leaving a page with unsaved edits.
 *
 * In-app links (the sidebar, the header, any <a>/<Link>) are intercepted in
 * the capture phase while `isDirty`, and the target is handed back as
 * `pendingHref` so the page can show its own dialog; `confirmLeave` then
 * performs the navigation. Refresh / tab close / external links go through
 * the browser's native "leave site?" prompt instead — that one can't be
 * styled.
 *
 * The App Router has no route-change event to hook, so the browser back
 * button is not covered by this.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers need a value to show the prompt.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      // Modified clicks open a new tab — nothing to lose here.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      // External links fall through to beforeunload.
      if (url.origin !== window.location.origin) return;
      // Same page (hash links, the active nav item): let it through.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  }, [pendingHref, router]);

  const cancelLeave = useCallback(() => setPendingHref(null), []);

  return { pendingHref, confirmLeave, cancelLeave };
}
