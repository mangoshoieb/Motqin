"use client";

import { SubjectCardClient } from "@/components/SubjectCard.client";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";

const SubjectsPage = () => {
  const { data: subjects, isPending, isError } = useGetSubjects();

  return (
    <div className="bg-zinc-100 min-h-screen flex flex-col gap-6 px-10">
      {/* Header */}
      <div className="p-10">
        <h1 className="text-3xl text-blue-950 font-bold">Available Subjects</h1>
      </div>

      {/* Subjects List */}
      <div className="flex flex-col gap-6 m-5 px-7">
        {isPending && <p className="text-zinc-500">Loading subjects...</p>}

        {isError && (
          <p className="text-red-600">Failed to load subjects. Please try again.</p>
        )}

        {subjects?.map((subject) => (
          <SubjectCardClient
            key={subject.subjectID}
            title={subject.name}
            href={`/subjects/${subject.subjectID}-${subject.name
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          ></SubjectCardClient>
        ))}
      </div>
    </div>  
  );
};

export default SubjectsPage;
