import axios, { AxiosError } from "axios";

// Shape we've seen the .NET backend send back on errors. Not every field is
// present on every error — we just take the first one that has a string in
// it. Loosen/extend this as you find more shapes coming back.
type BackendErrorBody = {
  message?: string;
  title?: string;
  detail?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
} | string;

// Generic Arabic fallback per status code, used only when the backend
// response has no usable message field. Customize these once you've seen
// what the backend actually sends for each case.
const STATUS_FALLBACKS: Record<number, string> = {
  400: "طلب غير صالح (400 Bad Request)",
  401: "يجب تسجيل الدخول مرة أخرى (401 Unauthorized)",
  403: "ليس لديك صلاحية للقيام بهذا الإجراء (403 Forbidden)",
  404: "لم يتم العثور على البيانات المطلوبة (404 Not Found)",
  409: "تعارض في البيانات (409 Conflict)",
  422: "بيانات غير صالحة (422 Unprocessable Entity)",
  429: "طلبات كثيرة جدًا، حاول لاحقًا (429 Too Many Requests)",
  500: "حدث خطأ في الخادم، حاول لاحقًا (500 Internal Server Error)",
  502: "الخادم غير متاح حاليًا (502 Bad Gateway)",
  503: "الخدمة غير متاحة حاليًا (503 Service Unavailable)",
};

/** Best-effort human-readable message for any API error. */
export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "حدث خطأ غير متوقع";
  }

  const axiosError = error as AxiosError<BackendErrorBody>;

  if (!axiosError.response) {
    return axiosError.code === "ECONNABORTED"
      ? "انتهت مهلة الاتصال بالخادم"
      : "تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت";
  }

  const { status, data } = axiosError.response;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data.title === "string" && data.title.trim()) {
      return data.title;
    }

    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail;
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    if (data.errors && typeof data.errors === "object") {
      const firstEntry = Object.values(data.errors)[0];

      if (Array.isArray(firstEntry) && typeof firstEntry[0] === "string") {
        return firstEntry[0];
      }

      if (typeof firstEntry === "string") {
        return firstEntry;
      }
    }
  }

  return STATUS_FALLBACKS[status] ?? `حدث خطأ غير متوقع (${status})`;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
