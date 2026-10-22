"use client";

import { useState } from "react";
import { BrainCircuit, Info, Layers, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { toastApiError } from "@/app/lib/api-error";
import {
  useClearDefaultIntervals,
  useClearSubjectIntervals,
  useRepetitionIntervals,
  useSetDefaultIntervals,
  useSetSubjectIntervals,
} from "@/app/hooks/useRepetitionIntervals";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { useUnsavedChangesGuard } from "@/app/hooks/useUnsavedChangesGuard";
import {
  IntervalsEditor,
  formatDayCount,
  intervalsError,
  sameIntervals,
} from "@/components/Settings/Motqin/IntervalsEditor";
import { UnsavedChangesDialog } from "@/components/Settings/UnsavedChangesDialog";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";

const DEFAULT_KEY = "default";
const subjectKey = (subjectId: number) => `subject:${subjectId}`;

const listLabel = (intervals: number[]) => intervals.join("، ");

const formatReviewCount = (count: number) => {
  if (count === 1) return "مراجعة واحدة";
  if (count === 2) return "مراجعتان";
  if (count >= 3 && count <= 10) return `${count} مراجعات`;
  return `${count} مراجعة`;
};

// What a pending confirmation would undo.
type PendingReset = { kind: "default" } | { kind: "subject"; subjectId: number; subjectName: string };

function Badge({ tone, children }: { tone: "custom" | "system" | "new"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        tone === "custom" && "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
        tone === "system" && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
        tone === "new" && "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
      )}
    >
      {children}
    </span>
  );
}

// Save / undo for one list, plus whatever else that list can do.
function CardActions({
  dirty,
  error,
  saving,
  onSave,
  onUndo,
  children,
}: {
  dirty: boolean;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onUndo: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || !!error || saving}
        title={!dirty ? "لا توجد تغييرات لحفظها" : error ?? undefined}
        className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save size={15} />
        {saving ? "جاري الحفظ..." : "حفظ"}
      </button>
      {dirty && (
        <button
          type="button"
          onClick={onUndo}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Undo2 size={15} />
          تراجع
        </button>
      )}
      {error && dirty && <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>}
      <div className="ms-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

const MotqinSettingsPage = () => {
  const { data, isLoading, isError, refetch } = useRepetitionIntervals();
  const { data: allSubjects } = useGetSubjects();

  const setDefault = useSetDefaultIntervals();
  const clearDefault = useClearDefaultIntervals();
  const setSubject = useSetSubjectIntervals();
  const clearSubject = useClearSubjectIntervals();

  // Only what the student has changed, keyed by list; everything else shows
  // the server's copy. Subjects picked from "إضافة مادة" but not saved yet
  // live in `added`.
  const [edits, setEdits] = useState<Record<string, number[]>>({});
  const [added, setAdded] = useState<{ subjectId: number; subjectName: string }[]>([]);
  const [pickedSubject, setPickedSubject] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [pendingReset, setPendingReset] = useState<PendingReset | null>(null);

  // The default every subject without its own list follows.
  const effectiveDefault = data ? data.defaultIntervals ?? data.systemIntervals : [];
  const savedSubjects = data?.subjects ?? [];

  const serverValue = (key: string): number[] | undefined => {
    if (key === DEFAULT_KEY) return effectiveDefault;
    return savedSubjects.find((s) => subjectKey(s.subjectId) === key)?.intervals;
  };
  const valueOf = (key: string) => edits[key] ?? serverValue(key) ?? effectiveDefault;
  const isDirty = (key: string) => {
    const server = serverValue(key);
    return !server || (key in edits && !sameIntervals(edits[key], server));
  };
  const edit = (key: string, next: number[]) => setEdits((prev) => ({ ...prev, [key]: next }));
  const dropEdit = (key: string) =>
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const subjectCards = [
    ...savedSubjects.map((s) => ({ ...s, isNew: false })),
    ...added
      .filter((a) => !savedSubjects.some((s) => s.subjectId === a.subjectId))
      .map((a) => ({ ...a, intervals: valueOf(subjectKey(a.subjectId)), isNew: true })),
  ];
  const customizable = (allSubjects ?? []).filter(
    (subject) => !subjectCards.some((card) => card.subjectId === subject.subjectID),
  );

  const dirtyKeys = [DEFAULT_KEY, ...subjectCards.map((s) => subjectKey(s.subjectId))].filter(isDirty);
  const { pendingHref, confirmLeave, cancelLeave } = useUnsavedChangesGuard(dirtyKeys.length > 0);

  const maxRepetitions = data?.maxRepetitions ?? 4;

  const saveDefault = async () => {
    const intervals = valueOf(DEFAULT_KEY);
    if (intervalsError(intervals, maxRepetitions)) return false;
    setBusyKey(DEFAULT_KEY);
    try {
      await setDefault.mutateAsync(intervals);
      dropEdit(DEFAULT_KEY);
      toast.success("تم حفظ الفترات الافتراضية");
      return true;
    } catch (error) {
      toastApiError("تعذر حفظ الفترات الافتراضية", error);
      return false;
    } finally {
      setBusyKey(null);
    }
  };

  const saveSubject = async (subjectId: number, subjectName: string) => {
    const key = subjectKey(subjectId);
    const intervals = valueOf(key);
    if (intervalsError(intervals, maxRepetitions)) return false;
    setBusyKey(key);
    try {
      await setSubject.mutateAsync({ subjectId, subjectName, intervals });
      dropEdit(key);
      setAdded((prev) => prev.filter((a) => a.subjectId !== subjectId));
      toast.success(`تم حفظ فترات ${subjectName}`);
      return true;
    } catch (error) {
      toastApiError(`تعذر حفظ فترات ${subjectName}`, error);
      return false;
    } finally {
      setBusyKey(null);
    }
  };

  const saveAll = async () => {
    let ok = true;
    for (const key of dirtyKeys) {
      if (key === DEFAULT_KEY) ok = (await saveDefault()) && ok;
      else {
        const card = subjectCards.find((s) => subjectKey(s.subjectId) === key);
        if (card) ok = (await saveSubject(card.subjectId, card.subjectName)) && ok;
      }
    }
    return ok;
  };

  const confirmReset = async () => {
    const reset = pendingReset;
    setPendingReset(null);
    if (!reset) return;

    if (reset.kind === "default") {
      setBusyKey(DEFAULT_KEY);
      try {
        await clearDefault.mutateAsync();
        dropEdit(DEFAULT_KEY);
        toast.success("عادت الفترات الافتراضية إلى إعداد النظام");
      } catch (error) {
        toastApiError("تعذر استعادة إعداد النظام", error);
      } finally {
        setBusyKey(null);
      }
      return;
    }

    const key = subjectKey(reset.subjectId);
    setBusyKey(key);
    try {
      await clearSubject.mutateAsync(reset.subjectId);
      dropEdit(key);
      toast.success(`أصبحت ${reset.subjectName} تتبع الفترات الافتراضية`);
    } catch (error) {
      toastApiError("تعذر إزالة التخصيص", error);
    } finally {
      setBusyKey(null);
    }
  };

  const addSubject = () => {
    const subject = allSubjects?.find((s) => String(s.subjectID) === pickedSubject);
    if (!subject) return;
    setAdded((prev) => [...prev, { subjectId: subject.subjectID, subjectName: subject.name }]);
    // Starts from the default, so the student only changes what differs.
    edit(subjectKey(subject.subjectID), effectiveDefault);
    setPickedSubject("");
  };

  const discardNew = (subjectId: number) => {
    setAdded((prev) => prev.filter((a) => a.subjectId !== subjectId));
    dropEdit(subjectKey(subjectId));
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل تفضيلات متقن</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RotateCcw size={14} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const hasOwnDefault = data.defaultIntervals !== null;
  const defaultValue = valueOf(DEFAULT_KEY);

  return (
    <div className="flex flex-col gap-6">
      {pendingHref && (
        <UnsavedChangesDialog
          isSaving={busyKey !== null}
          onStay={cancelLeave}
          onDiscard={confirmLeave}
          onSaveAndLeave={async () => {
            if (await saveAll()) confirmLeave();
          }}
        />
      )}

      {pendingReset && (
        <ConfirmDialog
          title={
            pendingReset.kind === "default"
              ? "استعادة إعداد النظام؟"
              : `إزالة الفترات الخاصة بـ ${pendingReset.subjectName}؟`
          }
          description={
            pendingReset.kind === "default"
              ? `ستُحذف فتراتك الافتراضية، وتتبع موادك إعداد النظام (${listLabel(data.systemIntervals)} يوم).`
              : `ستعود ${pendingReset.subjectName} إلى الفترات الافتراضية (${listLabel(effectiveDefault)} يوم).`
          }
          confirmLabel={pendingReset.kind === "default" ? "استعادة" : "إزالة"}
          onConfirm={() => void confirmReset()}
          onClose={() => setPendingReset(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">تفضيلات متقن</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          تحكّم في مواعيد مراجعة دروسك بالتكرار المتباعد.
        </p>
      </div>

      {/* How the lists relate */}
      <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <Info size={18} className="mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1 leading-relaxed">
          <p>
            بعد أن تذاكر درسًا، يجدول متقن له مراجعات على فترات تتباعد تدريجيًا. كل فترة هي عدد الأيام قبل
            المراجعة التالية، وعدد الفترات هو عدد المراجعات (حتى {maxRepetitions}).
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
            لكل مادة: فتراتها الخاصة إن وُجدت، وإلا فترات الإعداد الافتراضي، وإلا إعداد النظام (
            {listLabel(data.systemIntervals)} يوم).
          </p>
        </div>
      </div>

      {/* Default for every subject */}
      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
            <BrainCircuit size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100">الفترات الافتراضية</h2>
              {hasOwnDefault ? <Badge tone="custom">مخصصة</Badge> : <Badge tone="system">إعداد النظام</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {hasOwnDefault
                ? "تنطبق على كل المواد التي ليس لها فترات خاصة."
                : "لم تحدد فترات بعد، فتتبع موادك إعداد النظام. عدّلها واحفظ لتصبح إعدادك الافتراضي."}
            </p>
          </div>
        </div>

        <IntervalsEditor
          value={defaultValue}
          onChange={(next) => edit(DEFAULT_KEY, next)}
          maxRepetitions={maxRepetitions}
          disabled={busyKey === DEFAULT_KEY}
        />

        <CardActions
          dirty={isDirty(DEFAULT_KEY)}
          error={intervalsError(defaultValue, maxRepetitions)}
          saving={busyKey === DEFAULT_KEY}
          onSave={() => void saveDefault()}
          onUndo={() => dropEdit(DEFAULT_KEY)}
        >
          {hasOwnDefault && (
            <button
              type="button"
              onClick={() => setPendingReset({ kind: "default" })}
              disabled={busyKey !== null}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <RotateCcw size={14} />
              استعادة إعداد النظام
            </button>
          )}
        </CardActions>
      </section>

      {/* Per-subject overrides */}
      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
            <Layers size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">فترات خاصة بمادة</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              لمادة تحتاج مراجعة أكثر أو أقل من غيرها — تحل محل الفترات الافتراضية لهذه المادة فقط.
            </p>
          </div>

          {/* Pick a subject to give its own list */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <select
              value={pickedSubject}
              onChange={(event) => setPickedSubject(event.target.value)}
              disabled={customizable.length === 0}
              aria-label="اختر مادة"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 disabled:opacity-60 sm:w-48 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">
                {customizable.length === 0 ? "كل موادك مخصصة" : "اختر مادة..."}
              </option>
              {customizable.map((subject) => (
                <option key={subject.subjectID} value={subject.subjectID}>
                  {subject.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSubject}
              disabled={!pickedSubject}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Plus size={15} />
              إضافة
            </button>
          </div>
        </div>

        {subjectCards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            كل موادك تتبع الفترات الافتراضية. اختر مادة لتحدد لها فترات خاصة.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {subjectCards.map((card) => {
              const key = subjectKey(card.subjectId);
              const value = valueOf(key);
              return (
                <div
                  key={card.subjectId}
                  className={cn(
                    "flex flex-col gap-4 rounded-2xl border p-4",
                    card.isNew
                      ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/10"
                      : "border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{card.subjectName}</h3>
                    {card.isNew ? (
                      <Badge tone="new">جديدة — لم تُحفظ بعد</Badge>
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatReviewCount(value.length)} · آخرها بعد {formatDayCount(value.reduce((sum, gap) => sum + gap, 0))} من المذاكرة
                      </span>
                    )}
                  </div>

                  <IntervalsEditor
                    value={value}
                    onChange={(next) => edit(key, next)}
                    maxRepetitions={maxRepetitions}
                    disabled={busyKey === key}
                  />

                  <CardActions
                    dirty={isDirty(key)}
                    error={intervalsError(value, maxRepetitions)}
                    saving={busyKey === key}
                    onSave={() => void saveSubject(card.subjectId, card.subjectName)}
                    onUndo={() => (card.isNew ? discardNew(card.subjectId) : dropEdit(key))}
                  >
                    {!card.isNew && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingReset({
                            kind: "subject",
                            subjectId: card.subjectId,
                            subjectName: card.subjectName,
                          })
                        }
                        disabled={busyKey !== null}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={14} />
                        إزالة التخصيص
                      </button>
                    )}
                  </CardActions>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MotqinSettingsPage;
