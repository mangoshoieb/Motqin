import CustomButton from "@/components/CustomButton";
import { FeatureCard } from "@/components/FeautureCard";
import Footer from "@/components/Footer";
import { Trophy, Bot, BookOpen, ShieldOff, CalendarCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const isLoggedIn = true;
  return (
    <main className=" min-h-screen w-full   bg-[var(--surface)] sm:items-start font-sans">
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
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-10 gap-6 auto-rows-[80px]">
          <Link href="/planner" className="col-span-7 row-span-4 rounded-3xl">
            <FeatureCard
              title="Planner"
              description="Plan your study sessions and track your daily progress"
              icon={CalendarCheck}
              variant="planner"
              size="hero"
              stats={[
                { label: "Tasks done", value: "17/20" },
                { label: "Streak", value: "5 days" },
              ]}
              backgroundImage="./bubbles.jpg"
            />
          </Link>
          {/* AI Teacher - Vertical card */}
          <Link
            href="/subjects"
            className="col-span-3 row-span-5 bg-violet-500 rounded-3xl"
          >
            <FeatureCard
              title="AI Teacher"
              description="Get instant help"
              icon={Bot}
              variant="ai-teacher"
              size="medium"
            />
          </Link>
          {/* Competitions - Wide card */}
          <FeatureCard
            title="Competitions"
            description="Challenge friends and climb the leaderboard"
            icon={Trophy}
            variant="competition"
            backgroundIcon={Trophy}
            size="large"
            stats={[
              { label: "Rank", value: "#3" },
              { label: "Points", value: "2,450" },
            ]}
            className="col-span-5 row-span-3 bg-amber-400"
            // onClick={() => console.log("Navigate to Competitions")}
          />

          {/* Quiz - Square card */}
          <Link
            href="/subjects"
            className="col-span-2 row-span-3 bg-teal-500 rounded-3xl"
          >
            <FeatureCard
              title="Quiz"
              description="Test yourself"
              icon={BookOpen}
              variant="quiz"
              size="small"
            />
          </Link>
          <FeatureCard
            title="Focus Mode"
            description="Stay productive with app blocking"
            icon={ShieldOff}
            variant="focus"
            size="medium"
            stats={[{ label: "Minutes today", value: "45" }]}
            className="col-span-3 row-span-2 bg-rose-400"
            // onClick={() => console.log("Navigate to Focus Mode")}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
