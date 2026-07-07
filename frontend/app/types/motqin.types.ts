export {};
declare global {
  interface Subject {
    id: number;
    name: string;
    educationalStage: number;
    gradeLevel: number;
  }

  type getSubjectsResponse = Subject[];
}
