"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  BusyTime,
  BusyTimeMode,
  BusyTimePayload,
  busyTimesService,
} from "@/app/services/motqin";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

interface Draft {
  title: string;
  mode: BusyTimeMode;
  startTime: string;
  endTime: string;
  durationInMinutes: string;
  isRepeated: boolean;
  startDate: string;
  endDate: string;
}

const emptyDraft: Draft = {
  title: "",
  mode: "range",
  startTime: "09:00",
  endTime: "10:00",
  durationInMinutes: "120",
  isRepeated: false,
  startDate: "",
  endDate: "",
};

const formatDate = (value?: string) => (value ? value.slice(0, 10) : "");

export const RegularBusyTimeEditor = () => {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["repeated-busy-times"],
    queryFn: busyTimesService.getRepeated,
  });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["repeated-busy-times"] });

  const buildPayload = (): BusyTimePayload => {
    const payload: BusyTimePayload = {
      isRepeated: draft.isRepeated,
      title: draft.title.trim(),
    };

    if (draft.mode === "range") {
      payload.startTime = draft.startTime;
      payload.endTime = draft.endTime;
    } else {
      payload.durationInMinutes = Number(draft.durationInMinutes);
    }

    if (draft.isRepeated) {
      payload.startDate = draft.startDate;
      payload.endDate = draft.endDate;
    }

    return payload;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!draft.title.trim()) throw new Error("title-required");
      if (draft.mode === "range" && draft.startTime >= draft.endTime) {
        throw new Error("invalid-time-range");
      }
      if (draft.mode === "duration" && Number(draft.durationInMinutes) <= 0) {
        throw new Error("invalid-duration");
      }
      if (draft.isRepeated && (!draft.startDate || !draft.endDate)) {
        throw new Error("dates-required");
      }
      if (draft.isRepeated && draft.startDate > draft.endDate) {
        throw new Error("invalid-date-range");
      }

      const payload = buildPayload();
      return editingId === null
        ? busyTimesService.create(payload)
        : busyTimesService.update(editingId, payload);
    },
    onSuccess: () => {
      toast.success(editingId === null ? "تمت إضافة الوقت المشغول" : "تم تحديث الوقت المشغول");
      setDraft(emptyDraft);
      setEditingId(null);
      refresh();
    },
    onError: (error) => {
      const messages: Record<string, string> = {
        "title-required": "العنوان مطلوب.",
        "invalid-time-range": "وقت النهاية يجب أن يكون بعد وقت البداية.",
        "invalid-duration": "المدة يجب أن تكون أكبر من صفر.",
        "dates-required": "يرجى تحديد تاريخ البداية والنهاية للتكرار.",
        "invalid-date-range": "تاريخ النهاية يجب أن يكون بعد تاريخ البداية.",
      };
      toast.error(messages[error.message] ?? "حدث خطأ أثناء حفظ الوقت المشغول.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: busyTimesService.remove,
    onSuccess: () => {
      toast.success("تم حذف الوقت المشغول");
      refresh();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف الوقت المشغول."),
  });

  const editBusyTime = (item: BusyTime) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      mode: item.durationInMinutes !== undefined ? "duration" : "range",
      startTime: item.startTime?.slice(0, 5) ?? "09:00",
      endTime: item.endTime?.slice(0, 5) ?? "10:00",
      durationInMinutes: String(item.durationInMinutes ?? 120),
      isRepeated: item.isRepeated,
      startDate: formatDate(item.startDate),
      endDate: formatDate(item.endDate),
    });
  };

  const items = [...(data?.tasks ?? []), ...(data?.courses ?? [])];

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          العنوان
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="مثال: موعد طبيب أو نشاط رياضي"
            className={inputClass}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
            <input type="radio" checked={draft.mode === "range"} onChange={() => setDraft({ ...draft, mode: "range" })} />
            وقت البداية والنهاية
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
            <input type="radio" checked={draft.mode === "duration"} onChange={() => setDraft({ ...draft, mode: "duration" })} />
            مدة فقط
          </label>
        </div>

        {draft.mode === "range" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">من<input type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} className={inputClass} /></label>
            <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">إلى<input type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className={inputClass} /></label>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">المدة بالدقائق<input type="number" min={1} value={draft.durationInMinutes} onChange={(event) => setDraft({ ...draft, durationInMinutes: event.target.value })} className={inputClass} /></label>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={draft.isRepeated} onChange={(event) => setDraft({ ...draft, isRepeated: event.target.checked })} />
          هذا الوقت متكرر
        </label>

        {draft.isRepeated && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">يبدأ التكرار<input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} className={inputClass} /></label>
            <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">ينتهي التكرار<input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} className={inputClass} /></label>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Plus size={16} />{saveMutation.isPending ? "جاري الحفظ..." : editingId === null ? "إضافة وقت" : "حفظ التعديل"}</button>
        {editingId !== null && <button type="button" onClick={() => { setDraft(emptyDraft); setEditingId(null); }} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"><X size={16} />إلغاء</button>}
      </div>

      <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">الأوقات المضافة</h3>
        {isPending && <p className="text-sm text-zinc-500">جاري التحميل...</p>}
        {!isPending && items.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">لم تتم إضافة أوقات بعد.</p>}
        {items.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"><span className="truncate text-zinc-700 dark:text-zinc-300">{item.title} - {item.durationInMinutes !== undefined ? `${item.durationInMinutes} دقيقة` : `${item.startTime?.slice(0, 5)} إلى ${item.endTime?.slice(0, 5)}`}{item.isRepeated ? " - متكرر" : ""}</span><span className="flex gap-2"><button type="button" title="تعديل" onClick={() => editBusyTime(item)} className="text-zinc-500 hover:text-blue-600"><Pencil size={16} /></button><button type="button" title="حذف" onClick={() => deleteMutation.mutate(item.id)} className="text-zinc-500 hover:text-red-600"><Trash2 size={16} /></button></span></div>)}
      </div>
    </div>
  );
};