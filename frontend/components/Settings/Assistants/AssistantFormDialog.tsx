"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage, getCodedApiError, isAuthGateError } from "@/app/lib/api-error";
import { normalizeEgyptianPhone } from "@/app/lib/phone";
import { useAssistantPermissions } from "@/app/hooks/useLookups";
import { useAddAssistant, useTrackingTables, useUpdateAssistant } from "@/app/hooks/useTrackingTables";
import { isOwnTable } from "@/app/lib/tracking-table";
import { AssistantPermission, TrackingAssistant } from "@/app/types/tracking-table.types";
import { Switch } from "@/components/ui/switch";

interface AssistantFormDialogProps {
  // null when adding.
  assistant: TrackingAssistant | null;
  onClose: () => void;
  // assistant_exists: the number is already an assistant — open theirs.
  onExisting: (phoneNumber: string) => void;
}

export const AssistantFormDialog = ({ assistant, onClose, onExisting }: AssistantFormDialogProps) => {
  const allPermissions = useAssistantPermissions();
  const { data: tables } = useTrackingTables();
  const addAssistant = useAddAssistant();
  const updateAssistant = useUpdateAssistant();

  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState<AssistantPermission[]>(assistant?.permissions ?? []);
  const [allTables, setAllTables] = useState(assistant?.allTables ?? false);
  const [groupIds, setGroupIds] = useState<string[]>(assistant?.tables.map((t) => t.groupId) ?? []);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saving = addAssistant.isPending || updateAssistant.isPending;
  // Only the teacher's own tables can be shared.
  const ownTables = (tables ?? []).filter((table) => isOwnTable(table) && !table.isDeleted);
  const nothingChosen = !allTables && groupIds.length === 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const togglePermission = (key: AssistantPermission) =>
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  const toggleTable = (groupId: string) =>
    setGroupIds((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));

  const submit = async () => {
    setError(null);
    setPhoneError(null);
    const body = { permissions, allTables, ...(allTables ? {} : { groupIds }) };

    if (assistant) {
      try {
        await updateAssistant.mutateAsync({ id: assistant.id, body });
        toast.success(`تم تحديث صلاحيات ${assistant.name}، وتسري من الطلب التالي`);
        onClose();
      } catch (err) {
        if (!isAuthGateError(err)) setError(getApiErrorMessage(err));
      }
      return;
    }

    const phoneNumber = normalizeEgyptianPhone(phone);
    if (!phoneNumber) {
      setPhoneError("أدخل رقم موبايل مصري صحيح: 01 ثم 9 أرقام.");
      return;
    }
    try {
      const added = await addAssistant.mutateAsync({ phoneNumber, ...body });
      toast.success(`تمت إضافة ${added.name} إلى المساعدين، والوصول متاح من الآن`);
      onClose();
    } catch (err) {
      if (isAuthGateError(err)) return;
      const code = getCodedApiError(err)?.code;
      if (code === "assistant_exists") {
        toast.info("هذا الرقم من مساعديك بالفعل، فعرضنا الصلاحيات الحالية للتعديل");
        onExisting(phoneNumber);
        return;
      }
      const message =
        code === "user_not_found"
          ? "هذا الرقم ليس له حساب في متقن. اطلب من صاحبه التسجيل أولًا، ثم أضفه."
          : getApiErrorMessage(err);
      if (code === "user_not_found" || code === "invalid_phone" || code === "cannot_assist_self" || code === "validation_error") {
        setPhoneError(message);
      } else {
        setError(message);
      }
    }
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-form-title"
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 id="assistant-form-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {assistant ? `صلاحيات ${assistant.name}` : "إضافة مساعد"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
            {!assistant && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">رقم هاتف المساعد</span>
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  autoFocus
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setPhoneError(null);
                  }}
                  placeholder="01XXXXXXXXX"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {phoneError ? (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">{phoneError}</span>
                ) : (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    أي حساب مسجّل في متقن. يبدأ الوصول فورًا دون قبول، ولا يتغير نوع حسابه.
                  </span>
                )}
              </label>
            )}

            <fieldset className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ما يمكنه فعله</legend>
                <button
                  type="button"
                  onClick={() =>
                    setPermissions(permissions.length === allPermissions.length ? [] : allPermissions.map((p) => p.key))
                  }
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {permissions.length === allPermissions.length ? "إلغاء الكل" : "تحديد الكل"}
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                رؤية الجداول وطلابها وتقرير الأداء متاحة دائمًا. بدون أي اختيار يكون للعرض فقط.
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {allPermissions.map((item) => {
                  const on = permissions.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => togglePermission(item.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm transition",
                        on
                          ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-200"
                          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          on ? "border-blue-600 bg-blue-600 dark:bg-blue-700 text-white" : "border-zinc-300 dark:border-zinc-600",
                        )}
                      >
                        {on && <Check size={12} />}
                      </span>
                      {item.nameAr}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">كل الجداول</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    ومنها الجداول التي تُنشئها لاحقًا. أوقفه لتختار جداول بعينها.
                  </p>
                </div>
                <Switch
                  checked={allTables}
                  onCheckedChange={(next) => setAllTables(next)}
                  aria-label="كل الجداول"
                  className="mt-0.5 bg-zinc-300 data-[checked]:bg-blue-600 dark:bg-zinc-700 dark:data-[checked]:bg-blue-500"
                />
              </div>

              {!allTables &&
                (ownTables.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700">
                    ليس لديك جداول بعد.
                  </p>
                ) : (
                  <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-xl border border-zinc-200 p-1.5 dark:border-zinc-800">
                    {ownTables.map((table) => {
                      const on = groupIds.includes(table.groupId);
                      return (
                        <button
                          key={table.groupId}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggleTable(table.groupId)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition",
                            on
                              ? "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                              : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border",
                              on ? "border-blue-600 bg-blue-600 dark:bg-blue-700 text-white" : "border-zinc-300 dark:border-zinc-600",
                            )}
                          >
                            {on && <Check size={12} />}
                          </span>
                          <span className="truncate">{table.groupName}</span>
                          <span className="ms-auto shrink-0 text-xs text-zinc-400">{table.rows} طالب</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              {nothingChosen && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  اختر جدولًا واحدًا على الأقل، أو شغّل «كل الجداول».
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || nothingChosen || (!assistant && !phone.trim())}
              className="rounded-lg bg-blue-600 dark:bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : assistant ? "حفظ الصلاحيات" : "إضافة المساعد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
