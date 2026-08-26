// hooks/useGetQuestionsByLesson.ts
//
// @deprecated The backend no longer returns the flat `Question` shape from
// /questions/by-lesson — it returns LessonInformation rows. Use
// useGetLessonInformation instead. Kept as a re-export so any straggling
// import keeps compiling; delete once nothing references it.

export { useGetLessonInformation as useGetQuestionsByLesson } from "./useGetLessonInformation";
