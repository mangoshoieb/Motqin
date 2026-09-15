"use client";

import { useState } from "react";
import { cn } from "@/app/lib/utils";
import { avatarColorFor, initialsFor } from "@/app/lib/user";

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  // Pixel size of the circle.
  size?: number;
  className?: string;
}

// Photo when the user has one, coloured initial otherwise (and if the photo
// URL fails to load).
export default function UserAvatar({ name, photoUrl, size = 36, className }: UserAvatarProps) {
  const [broken, setBroken] = useState(false);
  const showPhoto = Boolean(photoUrl) && !broken;

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white",
        !showPhoto && avatarColorFor(name),
        className,
      )}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl as string}
          alt={name}
          width={size}
          height={size}
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      ) : (
        initialsFor(name)
      )}
    </span>
  );
}
