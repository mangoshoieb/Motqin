import { FeatureCard } from "@/components/FeautureCard";
import { Trophy, Bot, BookOpen, ShieldOff, CalendarCheck } from "lucide-react";
import Link from "next/link";

export default function BentoGrid() {
  return (
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
        <Link
          href="/competitions"
          className="col-span-5 row-span-3 bg-amber-400 rounded-3xl"
        >
          <FeatureCard
            title="Competitions"
            description="Challenge friends and climb the leaderboard"
            icon={Trophy}
            variant="competition"
            backgroundIcon={Trophy}
            size="large"
            stats={[
              { label: "Rank", value: "#6" },
              { label: "Points", value: "1,755" },
            ]}
          />
        </Link>

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
  );
}
