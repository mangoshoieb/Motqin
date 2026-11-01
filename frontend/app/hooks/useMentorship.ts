"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mentorshipService } from "@/app/services/mentorship.service";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { BLOCKER_KEYS } from "@/app/hooks/useDistractionBlocker";
import {
  Mentee,
  MenteeDetail,
  MentorPrivileges,
  MyMentor,
  MyMentorsResponse,
} from "@/app/types/mentorship.types";

export const MENTORSHIP_KEYS = {
  myMentors: ["mentorship", "my-mentors"] as const,
  incoming: ["mentorship", "incoming"] as const,
  mentees: ["mentorship", "mentees"] as const,
  mentee: (id: number) => ["mentorship", "mentees", id] as const,
};

// Guests get 403 registration_required here, which pops the signup dialog —
// so nothing is fetched for them until they sign up.
const useIsRegistered = () => useAuthKind() === "user";

// ---- Student side -----------------------------------------------------------

export const useMyMentors = (options: { enabled?: boolean } = {}) => {
  const registered = useIsRegistered();
  return useQuery({
    queryKey: MENTORSHIP_KEYS.myMentors,
    queryFn: mentorshipService.getMyMentors,
    enabled: registered && (options.enabled ?? true),
  });
};

// Writes one returned link back into the list. A link that was cancelled or
// ended drops out — my-mentors only lists waiting and active ones.
const useWriteMyMentor = () => {
  const queryClient = useQueryClient();
  return (mentor: MyMentor) => {
    queryClient.setQueryData<MyMentorsResponse>(MENTORSHIP_KEYS.myMentors, (current) => {
      if (!current) return current;
      const live = mentor.status === "Pending" || mentor.status === "Active";
      const exists = current.mentors.some((m) => m.id === mentor.id);
      const mentors = !live
        ? current.mentors.filter((m) => m.id !== mentor.id)
        : exists
          ? current.mentors.map((m) => (m.id === mentor.id ? mentor : m))
          : [mentor, ...current.mentors];
      return { ...current, mentors };
    });
    // The lock may have moved with it.
    queryClient.invalidateQueries({ queryKey: MENTORSHIP_KEYS.myMentors });
    queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.settings });
  };
};

export const useInviteMentor = () => {
  const writeMentor = useWriteMyMentor();
  return useMutation({
    mutationFn: (phoneNumber: string) => mentorshipService.inviteMentor(phoneNumber),
    onSuccess: writeMentor,
  });
};

export const useUpdateMentorPrivileges = () => {
  const queryClient = useQueryClient();
  const writeMentor = useWriteMyMentor();
  return useMutation({
    mutationFn: ({ id, privileges }: { id: number; privileges: MentorPrivileges }) =>
      mentorshipService.updatePrivileges(id, privileges),
    onSuccess: writeMentor,
    onError: () => queryClient.invalidateQueries({ queryKey: MENTORSHIP_KEYS.myMentors }),
  });
};

export const useEndMentorship = () => {
  const writeMentor = useWriteMyMentor();
  return useMutation({
    mutationFn: (id: number) => mentorshipService.endMentorship(id),
    onSuccess: writeMentor,
  });
};

// ---- Mentor side ------------------------------------------------------------

export const useIncomingMentorRequests = () => {
  const registered = useIsRegistered();
  return useQuery({
    queryKey: MENTORSHIP_KEYS.incoming,
    queryFn: mentorshipService.getIncomingRequests,
    enabled: registered,
    refetchInterval: 60_000,
  });
};

// Polled on the mentor's pages so an unlock code a student just asked for
// shows up on its own — the mentor is usually reading it out right then.
// The settings sidebar only reads it for its badge (`poll: false`).
export const useMentees = ({ poll = true }: { poll?: boolean } = {}) => {
  const registered = useIsRegistered();
  return useQuery({
    queryKey: MENTORSHIP_KEYS.mentees,
    queryFn: mentorshipService.getMentees,
    enabled: registered,
    refetchInterval: poll ? 20_000 : false,
  });
};

export const useMentee = (id: number) => {
  const registered = useIsRegistered();
  return useQuery({
    queryKey: MENTORSHIP_KEYS.mentee(id),
    queryFn: () => mentorshipService.getMentee(id),
    enabled: registered && Number.isFinite(id),
    refetchInterval: 15_000,
  });
};

// Every mentor-side write changes the list, and usually the open detail.
const useRefreshMentorSide = () => {
  const queryClient = useQueryClient();
  return (id?: number) => {
    queryClient.invalidateQueries({ queryKey: MENTORSHIP_KEYS.incoming });
    queryClient.invalidateQueries({ queryKey: MENTORSHIP_KEYS.mentees, exact: true });
    if (id !== undefined) queryClient.invalidateQueries({ queryKey: MENTORSHIP_KEYS.mentee(id) });
  };
};

export const useAcceptMentorRequest = () => {
  const refresh = useRefreshMentorSide();
  return useMutation({
    mutationFn: (id: number) => mentorshipService.acceptRequest(id),
    onSettled: () => refresh(),
  });
};

export const useDeclineMentorRequest = () => {
  const refresh = useRefreshMentorSide();
  return useMutation({
    mutationFn: (id: number) => mentorshipService.declineRequest(id),
    onSettled: () => refresh(),
  });
};

// The detail is merged rather than replaced: the change responses carry the
// list fields only, not the week or the blocker.
const useWriteMentee = () => {
  const queryClient = useQueryClient();
  return (mentee: Mentee) => {
    queryClient.setQueryData<Mentee[]>(MENTORSHIP_KEYS.mentees, (current) =>
      current?.map((m) => (m.id === mentee.id ? mentee : m)),
    );
    queryClient.setQueryData<MenteeDetail>(MENTORSHIP_KEYS.mentee(mentee.id), (current) =>
      current ? { ...current, ...mentee } : current,
    );
  };
};

export const useApproveMenteeChange = () => {
  const writeMentee = useWriteMentee();
  const refresh = useRefreshMentorSide();
  return useMutation({
    mutationFn: (id: number) => mentorshipService.approveChange(id),
    onSuccess: (mentee) => {
      if (mentee) writeMentee(mentee);
    },
    onSettled: (_, __, id) => refresh(id),
  });
};

export const useRejectMenteeChange = () => {
  const writeMentee = useWriteMentee();
  const refresh = useRefreshMentorSide();
  return useMutation({
    mutationFn: (id: number) => mentorshipService.rejectChange(id),
    onSuccess: writeMentee,
    onSettled: (_, __, id) => refresh(id),
  });
};

export const useUnlinkMentee = () => {
  const queryClient = useQueryClient();
  const refresh = useRefreshMentorSide();
  return useMutation({
    mutationFn: (id: number) => mentorshipService.unlinkMentee(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Mentee[]>(MENTORSHIP_KEYS.mentees, (current) =>
        current?.filter((m) => m.id !== id),
      );
      queryClient.removeQueries({ queryKey: MENTORSHIP_KEYS.mentee(id) });
    },
    onSettled: () => refresh(),
  });
};
