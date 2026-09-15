// Display helpers for a user's public identity.

/** First two words of a full name: "Amgad Mahmoud Shoiep Abdo" → "Amgad Mahmoud". */
export const shortName = (fullName?: string | null, fallback = "مستخدم") => {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return words.length ? words.slice(0, 2).join(" ") : fallback;
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
];

/** Stable colour for an initials avatar, picked from the seed (id or name). */
export const avatarColorFor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const initialsFor = (name: string) => name.trim().charAt(0).toUpperCase() || "؟";
