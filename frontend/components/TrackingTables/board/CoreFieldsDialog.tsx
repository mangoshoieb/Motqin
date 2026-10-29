"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { CORE_FIELD_LABELS, CORE_FIELDS } from "@/app/constants/tracking-table.constants";
import { useSetCoreFields } from "@/app/hooks/useTrackingTables";
import { CoreField, TrackingColumn } from "@/app/types/tracking-table.types";
import { Modal, inputClass, primaryButton, secondaryButton } from "../ui";

// Fill the name and phones from columns of the table — usually right after
// an import whose headers weren't recognised. The columns themselves stay.
export function CoreFieldsDialog({
  groupId,
  columns,
  onClose,
}: {
  groupId: string;
  columns: TrackingColumn[];
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<Record<CoreField, string>>({ name: "", studentPhone: "", parentPhone: "" });
  const setCoreFields = useSetCoreFields(groupId);
  const any = Object.values(picked).some(Boolean);

  const submit = () =>
    setCoreFields.mutate(
      {
        name: picked.name || null,
        studentPhone: picked.studentPhone || null,
        parentPhone: picked.parentPhone || null,
      },
      {
        onSuccess: (result) => {
          toast.success(`تم تحديث ${result?.rowsUpdated ?? 0} طالب`, {
            description: result?.warnings?.length
              ? result.warnings.slice(0, 3).map((w) => `صف ${w.row}: ${w.message}`).join("\n")
              : undefined,
          });
          onClose();
        },
      },
    );

  return (
    <Modal
      title="الأعمدة الأساسية"
      description="اختر العمود الذي تُنسخ منه قيم الاسم والأرقام لكل الطلاب."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!any || setCoreFields.isPending} className={cn(primaryButton, "flex-1")}>
            {setCoreFields.isPending ? "جارٍ النسخ..." : "نسخ القيم"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {CORE_FIELDS.map((field) => (
          <label key={field} className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{CORE_FIELD_LABELS[field]}</span>
            <select
              value={picked[field]}
              onChange={(e) => setPicked((prev) => ({ ...prev, [field]: e.target.value }))}
              className={inputClass}
            >
              <option value="">— بدون تغيير —</option>
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </Modal>
  );
}
