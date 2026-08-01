import { SettingsSidebar } from "@/components/Settings/SettingsSidebar";

// dir="rtl" + the sidebar as the first flex child puts it on the right —
// the app's <html> has no dir attribute, so this needs to be explicit here
// rather than relying on inherited direction.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-10 py-8">
      <div className=" mx-auto flex flex-col lg:flex-row gap-10 items-start">
        <aside className="w-full lg:w-64 shrink-0">
          <SettingsSidebar />
        </aside>

        <div className="flex-1 w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}
