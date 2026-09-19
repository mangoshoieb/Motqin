// Arabic duration label from minutes: "45 دقيقة", "ساعة", "ساعتان و30 دقيقة",
// "3 ساعات و5 دقائق" — with the dual/plural forms the numbers call for.
const hoursLabel = (hours: number) => {
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتان";
  if (hours <= 10) return `${hours} ساعات`;
  return `${hours} ساعة`;
};

const minutesLabel = (minutes: number) => {
  if (minutes === 1) return "دقيقة";
  if (minutes === 2) return "دقيقتان";
  if (minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
};

export const formatMinutes = (totalMinutes: number) => {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return rest === 0 ? "0 دقيقة" : minutesLabel(rest);
  if (rest === 0) return hoursLabel(hours);
  return `${hoursLabel(hours)} و${minutesLabel(rest)}`;
};
