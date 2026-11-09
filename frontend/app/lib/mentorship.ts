import axios from "axios";
import { toast } from "sonner";
import { getApiErrorMessage, getCodedApiError, isAuthGateError } from "./api-error";
import { MAX_MENTORS } from "../constants/mentorship.constants";
import { Mentee, MentorPrivileges } from "../types/mentorship.types";

// Arabic agreement by count: 1 خطة واحدة, 2 خطتان, 3–10 خطط, 11+ (and 0)
// back to the singular — "5 خطة" or "12 خطط" read as plainly wrong.
const counted =
  (one: string, two: string, few: string, many: string) =>
  (count: number) => {
    if (count === 1) return one;
    if (count === 2) return two;
    if (count >= 3 && count <= 10) return `${count} ${few}`;
    return `${count} ${many}`;
  };

export const formatPlans = counted("خطة واحدة", "خطتان", "خطط", "خطة");
export const formatSessions = counted("جلسة واحدة", "جلستان", "جلسات", "جلسة");
export const formatDays = counted("يوم واحد", "يومان", "أيام", "يومًا");

// A change the mentor has to answer: a privilege the student switched off,
// or a request to end the link.
// A paused mentor can't approve or reject: the student's changes apply
// without them, so nothing waits on them.
export const awaitsApproval = (link: Pick<Mentee, "removalRequested" | "endRequested" | "paused">) =>
  !link.paused && (link.removalRequested.length > 0 || link.endRequested);

export const hasAnyPrivilege = (privileges: MentorPrivileges) =>
  privileges.canViewPerformance || privileges.canViewBlocker || privileges.canLockBlocker;

export function mentorshipErrorMessage(error: unknown): string {
  const coded = getCodedApiError<{ max?: number }>(error);
  if (!coded) return getApiErrorMessage(error);

  switch (coded.code) {
    case "invalid_phone":
      return "أدخل رقم موبايل مصري صحيح.";
    case "user_not_found":
      return "لا يوجد حساب في متقن بهذا الرقم. اطلب من صاحبه إنشاء حساب أولًا.";
    case "cannot_mentor_self":
      return "لا يمكنك أن تكون مشرف نفسك.";
    case "mentor_request_exists":
      return "أرسلت دعوة لهذا الشخص من قبل، أو هو مشرفك بالفعل.";
    case "mentor_limit_reached":
      return `يمكنك إضافة ${coded.details?.max ?? MAX_MENTORS} مشرفين على الأكثر، والدعوات المعلّقة منهم.`;
    case "mentee_limit_reached":
      return "هذا الشخص لا يستطيع متابعة طلاب أكثر.";
    case "mentorship_not_found":
      return "لم نعثر على هذه المتابعة، ربما انتهت.";
    case "mentorship_not_active":
      return "هذه المتابعة لم تبدأ بعد أو انتهت.";
    case "mentorship_not_pending":
      return "تم الرد على هذا الطلب بالفعل.";
    case "lock_held_by_another_mentor":
      return "مشرف آخر يحمل قفل الحجب. مشرف واحد فقط يمكنه حمله.";
    case "edited_elsewhere":
      return "تغيّرت هذه البيانات في اللحظة نفسها من مكان آخر. حدّث الصفحة وحاول مجددًا.";
    case "no_change_pending":
      return "لا يوجد طلب بانتظار موافقتك.";
    case "validation_error":
      return "بعض البيانات المرسلة غير صالحة.";
    default:
      // The server's Arabic catalogue; coded.message is English.
      return getApiErrorMessage(error);
  }
}

export function toastMentorshipError(label: string, error: unknown): void {
  // registration_required (guests) opens the signup popup instead.
  if (isAuthGateError(error)) return;

  console.error(label, axios.isAxiosError(error) ? error.response?.data : error);
  toast.error(label, { description: mentorshipErrorMessage(error) });
}
