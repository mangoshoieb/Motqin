// Session lengths offered up front. 25 is a pomodoro, 50 a double, 90 a full
// ultradian block — the three lengths students actually reach for.
export const FOCUS_DURATIONS = [25, 50, 90];

// "8 دقائق" / "45 دقيقة" / "1س 15د" — kept short enough to sit inside an app
// card. Arabic changes the noun by count: 1 دقيقة, 2 دقيقتان, 3–10 دقائق,
// 11+ back to دقيقة, so "10 دقيقة" reads as plainly wrong to a native eye.
export const formatUsage = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}س` : `${hours}س ${rest}د`;
  }

  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
};

// mm:ss, or h:mm:ss once the session passes an hour.
export const formatCountdown = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

// Arabic agreement for "مرة" — 1 مرة, 2 مرتان, 3-10 مرات, 11+ مرة.
export const formatTimes = (count: number) => {
  if (count === 1) return "مرة واحدة";
  if (count === 2) return "مرتان";
  if (count <= 10) return `${count} مرات`;
  return `${count} مرة`;
};
