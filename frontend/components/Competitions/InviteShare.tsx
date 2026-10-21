"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Gift, Link2, Ticket, Users } from "lucide-react";
import { formatFriends } from "@/app/constants/competition.constants";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { useMyInvite } from "@/app/hooks/useCompetitions";

export const INVITE_HEADLINE = "قم بإفادة أصدقائك واربح جوائز تصل إلى 1000 جنيه";

// The page's origin, read on the client only (empty while server-rendering).
const subscribeNever = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(
    subscribeNever,
    () => window.location.origin,
    () => "",
  );

// The student's invite code and link (GET /competition/my-invite), and how
// many friends have joined with it. A link the backend sends as a path is
// made absolute so it works once pasted elsewhere.
export const useInvite = () => {
  const { data: invite } = useMyInvite();
  const origin = useOrigin();
  const rawLink = invite?.inviteLink ?? "";
  const link = rawLink.startsWith("/") ? (origin ? `${origin}${rawLink}` : "") : rawLink;
  return {
    code: invite?.invitationCode ?? "",
    link,
    invitedCount: invite?.invitedCount ?? null,
  };
};

// A read-only value with a copy button; the icon turns into a check for a
// moment after copying.
function CopyField({
  label,
  value,
  icon,
  copiedMessage,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  copiedMessage: string;
  className?: string;
  valueClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(copiedMessage);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("تعذر النسخ، انسخه يدويًا");
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 py-1.5 pe-1.5 ps-3 dark:border-zinc-700 dark:bg-zinc-800/60",
        className,
      )}
    >
      <span className="shrink-0 text-zinc-400" aria-hidden>
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      <span
        dir="ltr"
        className={cn(
          "min-w-0 flex-1 truncate text-left text-sm text-zinc-700 dark:text-zinc-200",
          valueClassName,
        )}
      >
        {value || "…"}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        disabled={!value}
        title={`نسخ ${label}`}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50",
          copied
            ? "bg-emerald-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700",
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "تم النسخ" : "نسخ"}
      </button>
    </div>
  );
}

const SOCIALS = [
  {
    key: "facebook",
    label: "فيسبوك",
    Icon: FaFacebookF,
    className: "bg-[#1877F2] hover:bg-[#166fe0]",
  },
  {
    key: "whatsapp",
    label: "واتساب",
    Icon: FaWhatsapp,
    className: "bg-[#25D366] hover:bg-[#20bd5a]",
  },
  {
    key: "instagram",
    label: "إنستجرام",
    Icon: FaInstagram,
    className: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:brightness-110",
  },
  {
    key: "tiktok",
    label: "تيك توك",
    Icon: FaTiktok,
    className: "bg-zinc-900 hover:bg-black dark:bg-zinc-950 dark:ring-1 dark:ring-zinc-700",
  },
] as const;

// The full invite panel: headline, link + code on one line, and the four
// share targets underneath.
export const InviteSharePanel = () => {
  const { code, link, invitedCount } = useInvite();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-500/30"
          aria-hidden
        >
          <Gift size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {INVITE_HEADLINE}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            شارك رابط الدعوة أو الكود الخاص بك مع أصدقائك
          </p>
        </div>

        {/* How many have joined so far (GET /competition/my-invite). */}
        {invitedCount !== null && (
          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-emerald-50 px-4 py-2.5 dark:bg-emerald-950/30">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" aria-hidden />
            <div className="leading-tight">
              <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {invitedCount}
              </p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                {invitedCount === 0 ? "لم ينضم أحد بعد" : `انضم ${formatFriends(invitedCount)} بدعوتك`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Line 1: the link and the code */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <CopyField
          label="رابط الدعوة"
          value={link}
          icon={<Link2 size={16} />}
          copiedMessage="تم نسخ رابط الدعوة"
          className="sm:flex-1"
        />
        <CopyField
          label="كود الدعوة"
          value={code}
          icon={<Ticket size={16} />}
          copiedMessage="تم نسخ كود الدعوة"
          className="sm:w-60"
          valueClassName="font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Line 2: share targets (wired up later) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SOCIALS.map(({ key, label, Icon, className }) => (
          <button
            key={key}
            type="button"
            onClick={() => toast.info(`المشاركة عبر ${label} قريبًا`)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl px-3 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
              className,
            )}
          >
            <Icon size={18} aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
