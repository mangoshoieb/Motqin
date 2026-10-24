"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  // Shown under the image (e.g. the file name).
  caption?: string;
  onClose: () => void;
}

// Full-size view of an image over everything else. A click outside the
// image or Escape closes it. Rendered in a portal, and its clicks / keys are
// stopped here: React still bubbles them through the component tree, and
// the dialogs this opens from close on exactly those (overlay click, Escape).
export const ImageLightbox = ({ src, alt = "", caption, onClose }: ImageLightboxProps) =>
  createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? "معاينة الصورة"}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-black/80 p-4 animate-in fade-in duration-150 sm:p-8"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        autoFocus
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="إغلاق"
        className="absolute left-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not an optimisable asset */}
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-xl bg-white object-contain shadow-2xl animate-in zoom-in-95 duration-150"
      />

      {caption && (
        <p className="max-w-full truncate text-sm text-white/80" dir="auto">
          {caption}
        </p>
      )}
    </div>,
    document.body
  );
