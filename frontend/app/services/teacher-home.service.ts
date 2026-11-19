import { TeacherAlert } from "../types/teacher-home.types";

// TODO(api): replace with the real endpoint once the backend sends it, e.g.
//   const { data } = await axiosInstance.get("/tracking-tables/alerts");
//   return data.data;
// Until then this returns fixed mock alerts so the teacher home can be built.
const MOCK_ALERTS: TeacherAlert[] = [
  {
    id: "mock-1",
    kind: "grades_drop",
    title: "3 طلاب انخفضت درجاتهم",
    detail: "في آخر امتحانين مقارنة بمتوسطهم",
    groupName: "مجموعة السبت",
  },
  {
    id: "mock-2",
    kind: "missed_exam",
    title: "طالبان غابا عن الامتحان الأخير",
    groupName: "مجموعة الثلاثاء",
  },
  {
    id: "mock-3",
    kind: "assistant_request",
    title: "مساعد يطلب صلاحية إرسال التقارير",
  },
];

export const teacherHomeService = {
  async getAlerts(): Promise<TeacherAlert[]> {
    return MOCK_ALERTS;
  },
};
