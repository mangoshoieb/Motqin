import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";



export const subjectsService = {
async getAllSubjects(): Promise<getSubjectsResponse> {
    const { data } = await axiosInstance.get(API_ROUTES.SUBJECTS.GET_ALL);

    return data;
  },
}