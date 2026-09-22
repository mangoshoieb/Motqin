"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth-storage";
import Nav from "@/components/Navbar/Nav";
import { GlobalSessionTimer } from "@/components/ExecutionBoard/GlobalSessionTimer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!authStorage.getAccessToken()) {
      router.replace("/sign-in");
    }
  }, [router]);

  if (!authStorage.getAccessToken()) {
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
