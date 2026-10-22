"use client";

import CustomButton from "@/components/CustomButton";
import Footer from "@/components/Footer";
import BentoGrid from "@/components/Home/BentoGrid";
import MagicSection from "@/components/Home/MagicSection";
import QuoteSection from "@/components/Home/QuoteSection";
import Image from "next/image";
import { useEffect } from "react";
import { useAuth } from "./context/auth.context";
import { authStorage } from "@/app/lib/auth-storage";
import { useAuthGate } from "@/app/lib/auth-gate.store";

// Once per visit, so coming back to the home page doesn't re-nag.
const WELCOME_SHOWN_KEY = "motqin:welcomeShown";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const openGate = useAuthGate((s) => s.open);

  // First landing with no session at all: sign in, sign up, or try as a
  // guest. Reads the token directly — the auth context still says "nobody"
  // during the first render even for signed-in users.
  useEffect(() => {
    if (authStorage.getAccessToken() || sessionStorage.getItem(WELCOME_SHOWN_KEY)) return;
    sessionStorage.setItem(WELCOME_SHOWN_KEY, "1");
    openGate({ kind: "welcome" });
  }, [openGate]);

  return (
    <main className="home-ambient-bg min-h-screen w-full sm:items-start font-sans">
      {isAuthenticated ? (
        <QuoteSection />
      ) : (
        <div className="relative w-full hero overflow-hidden min-h-screen">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-cover opacity-60 pointer-events-none"
            style={{ backgroundImage: "url('/hero-bg.svg')" }}
          />
          <div className="relative max-w-7xl mx-auto flex flex-col gap-15 items-end my-20 justify-end  px-6 md:px-12">
            <Image
              src="/متقن.svg"
              alt="Motqin Logo"
              width={400}
              height={50}
              priority
            />
            <h1 className="text-4xl font-bold mr-5 text-blue-900">.أتقن تركيزك. أتقن مستقبلك</h1>
            <div className="min-w-[30vw] mr-5 flex gap-15 items-end justify-end">
              <CustomButton
              title="دليل"
              className="w-[10vw] text-2xl"
              variant="outline"
              />
              <CustomButton
              title="أبدأ الان"
              className="w-[10vw] text-2xl"
              variant="primary"
              onClick={() => openGate({ kind: "welcome" })}
              />
            </div>
          </div>
        </div>
      )}
      <MagicSection />
      {/* <BentoGrid /> */}
      <Footer />
    </main>
  );
}
