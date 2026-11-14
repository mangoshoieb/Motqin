"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth-storage";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import Nav from "@/components/Navbar/Nav";
import { GlobalSessionTimer } from "@/components/ExecutionBoard/GlobalSessionTimer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // "none" on the server and during hydration, then the real value. Reading
  // localStorage straight in render made the server (no storage → nothing)
  // and the browser (token → the whole page) disagree on every load, which
  // threw hydration error #418 and re-rendered everything from scratch.
  const authKind = useAuthKind();

  useEffect(() => {
    // Reads storage directly: on the first commit authKind still says
    // "none", even for a signed-in user.
    if (!authStorage.getAccessToken()) {
      router.replace("/sign-in");
    }
  }, [router]);

  if (authKind === "none") {
    return null;
  }

  return (
    <>
      <Nav />
      {children}
      {/* The running study session's clock and floating countdown follow
          the student across pages. */}
      <GlobalSessionTimer />
    </>
  );
}
