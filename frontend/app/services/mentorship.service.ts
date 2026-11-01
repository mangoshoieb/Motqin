import axiosInstance from "../lib/axios";
import { MENTORSHIP_ROUTES as R } from "../constants/mentorship.constants";
import {
  IncomingMentorRequest,
  Mentee,
  MenteeDetail,
  MentorPrivileges,
  MyMentor,
  MyMentorsResponse,
} from "../types/mentorship.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === "object" && "data" in body && "success" in body
    ? (body as ApiEnvelope<T>).data
    : (body as T);

const get = async <T>(url: string) =>
  unwrap<T>((await axiosInstance.get<ApiEnvelope<T> | T>(url)).data);

const post = async <T>(url: string, body?: unknown) =>
  unwrap<T>((await axiosInstance.post<ApiEnvelope<T> | T>(url, body ?? {})).data);

const put = async <T>(url: string, body: unknown) =>
  unwrap<T>((await axiosInstance.put<ApiEnvelope<T> | T>(url, body)).data);

const list = <T>(items: T[] | null | undefined) => (Array.isArray(items) ? items : []);

export const mentorshipService = {
  // ---- Student side ----

  // By phone; the mentor needs an account. Shows on their page until they
  // answer.
  inviteMentor: (phoneNumber: string) => post<MyMentor>(R.REQUESTS, { phoneNumber }),

  getMyMentors: async (): Promise<MyMentorsResponse> => {
    const body = await get<MyMentorsResponse>(R.MY_MENTORS);
    return {
      mentors: list(body?.mentors),
      blockerLock: body?.blockerLock ?? { locked: false, unlockedUntil: null, codeExpiresAt: null },
    };
  },

  // All three, as wanted. Turning one on applies at once; turning one off
  // waits for the mentor (it shows in removalRequested meanwhile).
  updatePrivileges: (id: number, privileges: MentorPrivileges) =>
    put<MyMentor>(R.PRIVILEGES(id), privileges),

  // Cancels a waiting request, ends a link without privileges, or asks the
  // mentor to end one that has privileges (endRequested).
  endMentorship: (id: number) => post<MyMentor>(R.END(id)),

  // ---- Mentor side ----

  getIncomingRequests: async () => list(await get<IncomingMentorRequest[]>(R.INCOMING)),
  acceptRequest: (id: number) => post<Mentee>(R.ACCEPT(id)),
  declineRequest: (id: number) => post<{ id: number }>(R.DECLINE(id)),

  // A to Z.
  getMentees: async () => list(await get<Mentee[]>(R.MENTEES)),
  getMentee: (id: number) => get<MenteeDetail>(R.MENTEE(id)),

  // Agrees to the student's removalRequested / endRequested. Comes back
  // null when that ended the link.
  approveChange: (id: number) => post<Mentee | null>(R.APPROVE_CHANGE(id)),
  rejectChange: (id: number) => post<Mentee>(R.REJECT_CHANGE(id)),
  unlinkMentee: (id: number) => post<{ id: number }>(R.UNLINK(id)),
};
