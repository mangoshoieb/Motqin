"use client";

import { useState } from "react";
import { FileSpreadsheet, Plus, Search, Table2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useTrackingTables } from "@/app/hooks/useTrackingTables";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";
import { canOnTable, isOwnTable } from "@/app/lib/tracking-table";
import { TrackingTableSummary } from "@/app/types/tracking-table.types";
import { TableCard } from "@/components/TrackingTables/TableCard";
import { CreateTableDialog } from "@/components/TrackingTables/CreateTableDialog";
import { ImportTableDialog } from "@/components/TrackingTables/ImportTableDialog";
import { ReportsHistory } from "@/components/TrackingTables/reports/ReportsHistory";
import { Segmented, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

type Tab = "tables" | "reports";

// "جداولي" first, then one group per teacher who shared tables.
const groupTables = (tables: TrackingTableSummary[]) => {
  const groups: { key: string; title: string; tables: TrackingTableSummary[] }[] = [];
  const own = tables.filter(isOwnTable);
  if (own.length) groups.push({ key: "own", title: "جداولي", tables: own });
  for (const table of tables.filter((t) => !isOwnTable(t))) {
    const key = table.teacher?.userId ?? "shared";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, title: `جداول ${table.teacher?.name ?? "معلم"}`, tables: [] };
      groups.push(group);
    }
    group.tables.push(table);
  }
  return groups;
};

export default function TrackingTablesPage() {
  const [tab, setTab] = useState<Tab>("tables");
  const [dialog, setDialog] = useState<"create" | "import" | null>(null);
  const [search, setSearch] = useState("");
  const { data: tables, isLoading } = useTrackingTables();
  const { isTeacher, createFor, importFor } = useTrackingAccess();

  const canCreate = isTeacher || createFor.length > 0;
  const canImport = isTeacher || importFor.length > 0;
  // The sent-reports list needs PrepareReports on an assistant's side.
  const canSeeReports = isTeacher || (tables ?? []).some((t) => canOnTable(t, "PrepareReports"));

  const shown = (tables ?? []).filter((t) => t.groupName.includes(search.trim()));
  const groups = groupTables(shown);
  // Headings only once there's more than one group to tell apart.
  const showHeadings = groups.length > 1 || groups.some((g) => g.key !== "own");

  const actions = (
    <>
      {canImport && (
        <button type="button" onClick={() => setDialog("import")} className={secondaryButton}>
          <FileSpreadsheet size={18} /> استيراد من Excel
        </button>
      )}
      {canCreate && (
        <button type="button" onClick={() => setDialog("create")} className={primaryButton}>
          <Plus size={18} /> جدول جديد
        </button>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">جداول المتابعة</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            تابع حضور طلابك وواجباتهم ودرجاتهم، وأرسل التقارير لأولياء الأمور.
          </p>
        </div>
        <div className="flex gap-2">{actions}</div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canSeeReports && (
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            className="w-full sm:w-72"
            options={[
              { value: "tables", label: "الجداول" },
              { value: "reports", label: "التقارير المرسلة" },
            ]}
          />
        )}
        {tab === "tables" && (tables?.length ?? 0) > 3 && (
          <div className="relative w-full sm:ms-auto sm:w-64">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مجموعة"
              className={cn(inputClass, "ps-9")}
            />
          </div>
        )}
      </div>

      <section className="mt-6">
        {tab === "reports" && canSeeReports ? (
          <ReportsHistory />
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : (tables?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
              <Table2 size={30} />
            </span>
            <h2 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {isTeacher ? "ابدأ أول جدول متابعة" : "لا توجد جداول مشاركة معك بعد"}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              {isTeacher
                ? "أنشئ جدولًا لكل مجموعة، أو استورد كشف الطلاب الذي عندك في Excel."
                : "حين يشارك المعلم جداوله معك تظهر هنا."}
            </p>
            {(canCreate || canImport) && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
          </div>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">لا توجد مجموعة بهذا الاسم.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                {showHeadings && (
                  <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    {group.title} <span className="font-normal">({group.tables.length})</span>
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tables.map((table) => (
                    <TableCard key={table.groupId} table={table} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {dialog === "create" && <CreateTableDialog onClose={() => setDialog(null)} />}
      {dialog === "import" && <ImportTableDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
