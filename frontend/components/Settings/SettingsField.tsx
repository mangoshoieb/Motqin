interface SettingsFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsField = ({ label, description, children }: SettingsFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</label>
      {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      {children}
    </div>
  );
};
