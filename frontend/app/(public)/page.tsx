"use client";

import CustomButton from "@/components/CustomButton";
import Footer from "@/components/Footer";
import BentoGrid from "@/components/Home/BentoGrid";
import MagicSection from "@/components/Home/MagicSection";
import QuoteSection from "@/components/Home/QuoteSection";
import Image from "next/image";
import { useAuth } from "./context/auth.context";

export default function Home() {
  const { isAuthenticated } = useAuth();

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
