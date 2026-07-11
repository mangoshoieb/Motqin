"use client";

import { useGetLessons } from "@/app/hooks/useGetLessons";
import { LessonCardClient } from "@/components/LessonCard.client";

import { useParams } from "next/navigation";

interface SubjectPageProps {
  params: {
    subjectId: string;
    lessonId:string;
  };
}
export const SubjectPage = () => {
  const params = useParams()
  const subjectId = params.subjectId as string;
  const id = subjectId.split("-")[0];
  const { data, isLoading, error } = useGetLessons(id);
  console.log('hi from lessons page')
  if (isLoading) return <>Loading...</>;
  
  if (error) return <>Something went wrong</>;
  console.log(data)

  return (
    <div className="p-10 flex-col gap-10 ">
      {data?.lessons?.map((lesson: Lesson) => (
        <LessonCardClient
          key={lesson.lessonId}
          name={lesson.title}
          href={`/subjects/${subjectId}/${lesson.lessonId}`}
        />
      ))}
    </div >
  );
};


export default SubjectPage;