"use client";

import { useQuery } from "@tanstack/react-query";
import { subjectsService } from "../services/motqin";

export function useGetSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getAllSubjects,
  });
}