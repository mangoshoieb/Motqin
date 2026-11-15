"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Entry point into the planner from outside it (home page, footer): opens
// today's plan first. "Today" is worked out in the browser so it's always
// the user's own day, never a server-rendered or cached one.
export default function PlannerTodayRedirect() {
  const router = useRouter();

  useEffect(() => {
    const todayIndex = new Date().getDay() + 1;
    router.replace(`/planner/execution/${todayIndex}?week=0`);
  }, [router]);

  return null;
}
