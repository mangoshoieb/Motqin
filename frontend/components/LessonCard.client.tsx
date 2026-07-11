"use client";

import { useState } from "react";
import { LessonCard } from "./LessonCard";

export const LessonCardClient = (props: any) => {
  const [hovered, setHovered] = useState(false);
  console.log("hi from lessoncard")

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
     className="my-4">
      <LessonCard {...props} arrowPlay={hovered} />
    </div>
  );
};
