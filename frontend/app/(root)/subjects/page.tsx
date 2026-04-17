"use client";

import { SubjectCard } from "@/components/SubjectCard";
import { SubjectCardClient } from "@/components/SubjectCard.client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubjectPageProps {
  params: {
    subjectId: string;
  };
}
interface Subject {
  subjectId: string;
  subjectName: string;
  lessonsNumber: number;
}
const getSubjects = (): Promise<{
  success: boolean;
  message: string;
  data: Subject[];
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Subjects fetched successfully",
        data: [
          {
            subjectId: "sub_001",
            subjectName: "Mathematics",
            lessonsNumber: 24,
          },
          { subjectId: "sub_002", subjectName: "Physics", lessonsNumber: 18 },
          { subjectId: "sub_003", subjectName: "Chemistry", lessonsNumber: 20 },
          { subjectId: "sub_004", subjectName: "Biology", lessonsNumber: 15 },
          {
            subjectId: "sub_005",
            subjectName: "Computer Science",
            lessonsNumber: 30,
          },
        ],
      });
    }, 1000);
  });
};

const SubjectPage = ({ params }: SubjectPageProps) => {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  // const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { subjectId } = params;
  useEffect(() => {
    getSubjects().then((response) => {
      if (response.success) {
        setSubjects(response.data);

        // find selected subject
        // const found = response.data.find((sub) => sub.subjectId === subjectId);
        // setSelectedSubject(found || null);
      }
    });
  }, [subjectId]);

  return (
    <div className="bg-zinc-100 min-h-screen flex flex-col gap-6 px-10">
      {/* Header */}
      <div className="p-10">
        <h1 className="text-3xl text-blue-950 font-bold">Available Subjects</h1>
      </div>

      {/* Subjects List */}
      <div className="flex flex-col gap-6 m-5 px-7">
        {subjects.map((subject) => (
          <SubjectCardClient
            key={subject.subjectId}
            title={subject.subjectName}
            href={`/subjects/${subject.subjectId}-${subject.subjectName
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          ></SubjectCardClient>
        ))}
      </div>
    </div>
  );
};

export default SubjectPage;
