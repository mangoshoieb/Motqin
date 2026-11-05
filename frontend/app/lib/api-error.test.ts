// Coded API errors ({ error: { code, details } }) carry an English message
// meant for developers. What the user reads comes from the server's Arabic
// catalogue (GET /lookups/error-codes), with the API guides' copy for codes
// the catalogue doesn't list yet.
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./api-error";
import { setErrorCatalogue } from "./error-codes";

// The bit of an AxiosError getApiErrorMessage reads.
const apiError = (status: number, data: unknown) => ({
  isAxiosError: true,
  response: { status, data },
});

describe("getApiErrorMessage with coded errors", () => {
  it("shows the catalogue's Arabic message, never the English one", () => {
    setErrorCatalogue([
      { code: "blocker_locked", status: 400, group: "Mentors", message: "إعدادات مانع التشتت مقفلة" },
    ]);
    const error = apiError(400, {
      success: false,
      data: null,
      error: { code: "blocker_locked", message: "Your mentor locked these settings." },
    });
    expect(getApiErrorMessage(error)).toBe("إعدادات مانع التشتت مقفلة");
  });

  it("reads a flat { code } body the same way", () => {
    setErrorCatalogue([
      { code: "table_not_found", status: 404, group: "TrackingTables", message: "الجدول غير موجود" },
    ]);
    expect(getApiErrorMessage(apiError(404, { code: "table_not_found", message: "x" }))).toBe("الجدول غير موجود");
  });

  it("falls back to the guide's copy for codes the catalogue doesn't list yet", () => {
    setErrorCatalogue([]);
    const error = apiError(400, { error: { code: "no_tables_chosen", message: "Choose a table." } });
    expect(getApiErrorMessage(error)).toBe("اختر جدولاً واحداً على الأقل أو كل الجداول");
  });

  it("names the missing permission on assistant_permission_missing", () => {
    setErrorCatalogue([]);
    const error = apiError(403, {
      error: {
        code: "assistant_permission_missing",
        message: "The teacher hasn't given you the EditTables permission.",
        details: { permission: "EditTables" },
      },
    });
    expect(getApiErrorMessage(error)).toBe("ليس لديك صلاحية لهذا الإجراء: تعديل الجداول والأعمدة");
  });

  it("keeps a plain message when there's no code", () => {
    expect(getApiErrorMessage(apiError(400, { success: false, message: "رسالة عادية" }))).toBe("رسالة عادية");
  });

  it("lets an unknown code fall through to the status fallback, not the English text", () => {
    setErrorCatalogue([]);
    const error = apiError(400, { error: { code: "brand_new_code", message: "English only" } });
    expect(getApiErrorMessage(error)).not.toBe("English only");
  });
});
