"use client";

import { useCallback, useState } from "react";
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
  // The URL that failed, rather than a flag: a different photo then gets its
  // own chance to load without anything having to reset state.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const showPhoto = Boolean(photoUrl) && photoUrl !== brokenUrl;

  // An image that already failed by the time React attached to it never
  // fires onError — server-rendered markup hydrates too late to hear it.
  // Checking the element as it attaches catches that: an image the browser
  // is done with that has no pixels is a broken one.
  const checkLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setBrokenUrl(img.src);
  }, []);

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
          ref={checkLoaded}
          src={photoUrl as string}
          alt={name}
          width={size}
          height={size}
          onError={() => setBrokenUrl(photoUrl as string)}
          className="size-full object-cover"
        />
      ) : (
        initialsFor(name)
      )}
    </span>
  );
}
