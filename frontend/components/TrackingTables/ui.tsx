"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Small building blocks shared by the tracking-table screens. Popovers and
// menus render in a portal, so the grid's scroll box doesn't clip them.

export const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

export const ghostButton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const popupClass =
  "rounded-2xl border border-zinc-200 bg-white p-1.5 text-sm text-zinc-800 shadow-xl shadow-zinc-900/10 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/40 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 transition-[opacity,transform] duration-100 origin-[var(--transform-origin)]";

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          "flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:rounded-3xl dark:border-zinc-800 dark:bg-zinc-900",
          className,
        )}
      >
        <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className={cn(ghostButton, "-me-2 p-1.5")} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center gap-3 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = "start",
  side = "bottom",
  className,
}: {
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => onOpenChange?.(next)}>
      <PopoverPrimitive.Trigger render={trigger} />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side={side} align={align} sideOffset={6} className="z-[110]">
          <PopoverPrimitive.Popup dir="rtl" className={cn(popupClass, className)}>
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export interface MenuEntry {
  label: string;
  Icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

export function Dropdown({
  trigger,
  items,
  header,
  align = "start",
}: {
  trigger: ReactElement;
  items: MenuEntry[];
  header?: ReactNode;
  align?: "start" | "center" | "end";
}) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger render={trigger} />
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner align={align} sideOffset={6} className="z-[110]">
          <MenuPrimitive.Popup dir="rtl" className={cn(popupClass, "min-w-52")}>
            {header}
            {items.map((item) => (
              <div key={item.label}>
                {item.separatorBefore && <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />}
                <MenuPrimitive.Item
                  disabled={item.disabled}
                  onClick={item.onSelect}
                  className={cn(
                    "flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2 outline-none select-none data-[highlighted]:bg-zinc-100 data-[disabled]:opacity-40 dark:data-[highlighted]:bg-zinc-800",
                    item.danger && "text-rose-600 dark:text-rose-400",
                    item.active && "font-bold text-blue-600 dark:text-blue-400",
                  )}
                >
                  {item.Icon && <item.Icon size={16} className="shrink-0 opacity-80" />}
                  {item.label}
                </MenuPrimitive.Item>
              </div>
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

// A row of options where exactly one is on (row size, filter value...).
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            value === option.value
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
