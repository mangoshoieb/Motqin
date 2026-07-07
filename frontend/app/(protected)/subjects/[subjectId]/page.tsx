"use client";

import { LessonCard } from "@/components/LessonCard";
import { LessonCardClient } from "@/components/LessonCard.client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubjectPageProps {
  params: {
    subjectId: string;
    lessonId:string;
  };
}
interface Subject {
  subjectId: string;
  lessonsNumber: number;
  Lessons: Lesson [];
}

interface Lesson {
  lessonId: string;
  lessonName: string;
  lessonStatus: "start" | "continue" | "review"
  duration?: number; // minutes
  lastAccessed?: string; // ISO date
  nextReviewDate?: string; // for spaced repetition
  outlines:string[]
}
const getLessons = (subjectId: string): Promise<{
  success: boolean;
  message: string;
  data: {
    subjectId: string;
    lessons: Lesson[];
  };
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Lessons fetched successfully",
        data: {
          subjectId,
          lessons: [
            {
              lessonId: "les_001",
              lessonName: "Introduction to Algebra",
              lessonStatus: "review",
              duration: 20,
              nextReviewDate: "2026-04-20",
              outlines: [
                "What is Algebra?",
                "Variables and Constants",
                "Basic Operations",
                "Real-life Examples"
              ]
            },
            {
              lessonId: "les_002",
              lessonName: "Linear Equations",
              lessonStatus: "continue",
              duration: 25,
              outlines: [
                "Definition of Linear Equations",
                "Solving One Variable Equations",
                "Graphing Lines",
                "Practice Problems"
              ]
            },
            {
              lessonId: "les_003",
              lessonName: "Quadratic Equations",
              lessonStatus: "start",
              duration: 30,
              outlines: [
                "What is a Quadratic Equation?",
                "Factoring Method",
                "Quadratic Formula",
                "Applications"
              ]
            },
            {
              lessonId: "les_004",
              lessonName: "Functions Basics",
              lessonStatus: "start",
              duration: 22,
              outlines: [
                "Definition of Functions",
                "Domain and Range",
                "Function Notation",
                "Examples"
              ]
            },
            {
              lessonId: "les_005",
              lessonName: "Graphing Functions",
              lessonStatus: "start",
              duration: 28,
              outlines: [
                "Coordinate System",
                "Plotting Points",
                "Understanding Graph Shapes",
                "Real-world Graphs"
              ]
            }
          ]
        }
      });
    }, 1000);
  });
};

const SubjectPage = ({ params }: SubjectPageProps) => {
  const router = useRouter();

  const [ lessons, setLessons] = useState<Lesson[]>([]);
  // const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { subjectId,lessonId } = params;
  useEffect(() => {
    getLessons(subjectId).then((response) => {
      if (response.success) {
        setLessons(response.data.lessons);

        // find selected subject
        // const found = response.data.find((sub) => sub.subjectId === subjectId);
        // setSelectedSubject(found || null);
      }
    });
  }, [subjectId,lessonId]);

  return (
    <div className="bg-zinc-100 min-h-screen flex flex-col gap-6 px-10">
      {/* Header */}
      <div className="p-10">
        <h1 className="text-3xl text-blue-950 font-bold">Available Subjects</h1>
      </div>

      {/* Subjects List */}
      <div className="flex flex-col gap-6 m-5 px-7">
        {lessons.map((lesson) => (
          < LessonCardClient
            key={lesson.lessonId}
            title={lesson.lessonName}
            outlines={lesson.outlines}
            state={lesson.lessonStatus}
            href={`/subjects/${subjectId}/${lessonId}`}
          >
          </LessonCardClient>
        ))}
      </div>
    </div>
  );
};

export default SubjectPage;
