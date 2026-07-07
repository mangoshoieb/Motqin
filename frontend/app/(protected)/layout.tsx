"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth-storage";
import { Providers } from "../providers/providers";
import Nav from "@/components/Navbar/Nav";

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
    <Providers>
      <Nav />
      {children}
    </Providers>
  );
}
