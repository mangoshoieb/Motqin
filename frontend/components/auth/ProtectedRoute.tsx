// components/auth/ProtectedRoute.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/app/lib/auth-storage";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        if (!authStorage.getAccessToken()) {
            router.replace("/sign-in");
        }
    }, []);

    if (!authStorage.getAccessToken()) {
        return null;
    }

    return children;
}