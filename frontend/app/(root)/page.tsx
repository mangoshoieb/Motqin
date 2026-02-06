import { FeatureCard } from "@/components/FeautureCard";
import { Trophy, Bot, BookOpen, ShieldOff, CalendarCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const isLoggedIn = true;
  return (
    // <div className="min-h-screen  bg-[var(--surface)] f ">
      <main className="flex min-h-screen w-full flex-col items-center  py-16 px-16  bg-[var(--surface)] sm:items-start font-sans">
        <div className="flex items-center justify-center h-[50vh] w-full pr-20">
          <Image
            src="/متقن.svg"
            alt="Motqin Logo"
            width={600}
            height={90}
            priority
          />
        </div>
        <section className="mt-1 w-full  grid grid-cols-10 gap-6 auto-rows-[80px]">
          {/* Planner - Hero Card (spans 4 cols, 2 rows) */}
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
          {/* Focus - Compact card */}
          {/* <FeatureCard
            title="Focus"
            description="Block distractions"
            icon={ShieldOff}
            variant="focus"
            size="small"
            className="col-span-1 row-span-1 bg-rose-500"
            // onClick={() => console.log("Navigate to Focus Mode")}
          /> */}

          {/* Bottom row continuation */}
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

          {/* <FeatureCard
            title="Daily Quiz"
            description="Spaced repetition"
            icon={BookOpen}
            variant="quiz"
            size="small"
            className="col-span-1 row-span-1 bg-green-500"
            // onClick={() => console.log("Navigate to Quiz")}
          /> */}
        </section>
      </main>
    // </div>
  );
}
