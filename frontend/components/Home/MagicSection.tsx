"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Check,
  LucideIcon,
  ShieldOff,
  Trophy,
} from "lucide-react";
import { useHomeFeatureStats } from "@/app/hooks/useHomeFeatureStats";
import { HomeFeatureStats } from "@/app/types/home.types";

// Canvas matches the reference design's own composition, translated so its
// bounding box starts near the origin (original design used a 1440x950 page
// with the puzzle occupying roughly x:[222,1368] y:[206,703] — every
// coordinate below has that (222, 206) offset subtracted out so the shapes
// can be reused verbatim instead of re-derived).
const CANVAS_WIDTH = 1146;
const CANVAS_HEIGHT = 497;

// How many glowing pulses travel each connector at once, and how long one
// full lap takes — pulses are evenly spaced within that duration so a new
// one sets off just as the loop would otherwise start feeling empty.
// Hovering a piece swaps its own connector to the faster/denser numbers.
const PULSES_PER_CONNECTOR = 3;
const PULSE_DURATION_SECONDS = 8;
const PULSES_PER_CONNECTOR_HOVER = 3;
const PULSE_DURATION_SECONDS_HOVER = 3.5;

// Hover "lift": a satellite piece rises by LIFT canvas units and grows
// slightly — small enough that the puzzle still reads as interlocked.
const LIFT = 6;
const LIFT_SCALE = 1.045;
// The planner sits under every satellite, so growing it alone would poke
// its edges out past them. Hovering it lifts the whole puzzle instead.
const PUZZLE_LIFT_SCALE = 1.025;
// The other pieces fade so the hovered one is in the spotlight. Done with a
// filter, not opacity: a see-through satellite would show the planner
// under its overlapping edge.
const DIM_FILTER = "saturate(0.6) brightness(1.08)";

// Ease-out with a soft landing, for the hover reveal.
const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function getPulseBeginTimes(
  baseDelay: string,
  count: number,
  duration: number
): string[] {
  const base = parseFloat(baseDelay) || 0;
  const stagger = duration / count;
  return Array.from({ length: count }, (_, i) => `${base + i * stagger}s`);
}

type StatKey = keyof HomeFeatureStats;

interface Feature {
  id: string;
  statKey: StatKey;
  // Where the icon/title/description sit — the piece's main rectangular
  // body, excluding its bump/socket geometry so text doesn't collide with it.
  contentBounds: { x0: number; y0: number; x1: number; y1: number };
  title: string;
  description: string;
  // Shown when the piece is hovered (and on the phone cards).
  features: string[];
  icon: LucideIcon;
  href: string;
  gradientFrom: string;
  gradientTo: string;
}

interface PuzzlePiece extends Feature {
  // Exact silhouette path, ported from the reference design (not
  // regenerated), so bumps/corners match the source pixel-for-pixel.
  path: string;
  shimmerDelay: string;
  // Background-colored circle rendered behind this piece, at the joint where
  // it overlaps the planner piece — creates the "socket ring" glow.
  halo: { cx: number; cy: number; r: number };
  // Connector trace from this piece's joint, looping through the planner's
  // interior and back into this same piece.
  connectorPath: string;
  connectorBeginDelay: string;
}

const planner: Feature & { rect: { x: number; y: number; width: number; height: number; rx: number } } = {
  id: "planner",
  statKey: "planner",
  // Plain rounded rectangle — the satellite pieces render on top of it and
  // simply overlap its edges to create the interlock illusion, so it needs
  // no bump/notch geometry of its own.
  rect: { x: 264, y: 73, width: 612, height: 350, rx: 9 },
  contentBounds: { x0: 314, y0: 80, x1: 876, y1: 423 },
  title: "المخطط",
  description: "خطط لجلسات مذاكرتك وتابع تقدمك اليومي",
  features: [
    "خطة أسبوعية بالذكاء الاصطناعي أو يدويًا",
    "جلسات يومية بمؤقت ومراجعات متباعدة",
    "تابع ما أنجزته يومًا بيوم",
  ],
  icon: CalendarCheck,
  href: "/planner/today",
  gradientFrom: "#3b82f6",
  gradientTo: "#1d4ed8",
};

const pieces: PuzzlePiece[] = [
  {
    id: "competitions",
    statKey: "competitions",
    path: `M246 73C250.971 73 255 77.029 255 82V174.205C292.471 177.016 322 208.31 322 246.5C322 284.69 292.471 315.983 255 318.794V414C255 418.971 250.971 423 246 423H9C4.029 423 0 418.971 0 414V82C0 77.029 4.029 73 9 73H246Z`,
    contentBounds: { x0: 20, y0: 80, x1: 266, y1: 423 },
    title: "المسابقات",
    description: "نافس أصدقاءك وتصدر لوحة الترتيب",
    features: ["نافس زملاءك في اختبارات مباشرة", "تصدّر لوحة الترتيب واجمع النقاط"],
    icon: Trophy,
    href: "/competitions",
    gradientFrom: "#fbbf24",
    gradientTo: "#d97706",
    shimmerDelay: "0s",
    halo: { cx: 249.5, cy: 246.5, r: 82.5 },
    connectorPath: `M112.5 88.5V193L728 191.124V308H112.5V402.5`,
    connectorBeginDelay: "0s",
  },
  {
    id: "blocker",
    statKey: "blocker",
    path: `M1137 0C1141.97 0 1146 4.029 1146 9V189C1146 193.971 1141.97 198 1137 198H883.5V142.7C875.4 167.833 851.83 186.018 824 186.018C789.48 186.018 761.5 158.035 761.5 123.518C761.5 100.469 773.977 80.336 792.54 69.5H766V9C766 4.029 770.029 0 775 0H1137Z`,
    contentBounds: { x0: 883.5, y0: 0, x1: 1146, y1: 198 },
    title: "منع المشتتات",
    description: "احجب التطبيقات المشتتة أثناء المذاكرة",
    features: ["احجب التطبيقات المشتتة على هاتفك", "جداول حجب تلقائية وقت المذاكرة"],
    icon: ShieldOff,
    href: "/focus",
    gradientFrom: "#ef4444",
    gradientTo: "#b91c1c",
    shimmerDelay: "1.5s",
    halo: { cx: 824, cy: 123, r: 69 },
    connectorPath: `M1100 41.5C873.6 41.5 816.33 41.5 816 41.5V110H389.5V368H731C731 339 761.6 283 816 283V132H1100`,
    connectorBeginDelay: "2s",
  },
  {
    id: "quiz",
    statKey: "quiz",
    path: `M1137 497C1141.97 497 1146 492.971 1146 488V308C1146 303.029 1141.97 299 1137 299H883.5V354.3C875.4 329.167 851.83 310.982 824 310.982C789.48 310.982 761.5 338.965 761.5 373.482C761.5 396.531 773.977 416.664 792.54 427.5H766V488C766 492.971 770.029 497 775 497H1137Z`,
    contentBounds: { x0: 883.5, y0: 339, x1: 1146, y1: 497 },
    title: "متقن",
    description: "قيّم مستواك بأسئلة تفاعلية",
    features: ["أسئلة تفاعلية لكل مادة ودرس", "اعرف نقاط ضعفك من نتائجك"],
    icon: BookOpen,
    href: "/subjects",
    gradientFrom: "#34d399",
    gradientTo: "#0f766e",
    shimmerDelay: "3s",
    halo: { cx: 824, cy: 373, r: 69 },
    connectorPath: `M1106.5 462.5C880.1 462.5 822.83 462.5 822.5 462.5V394H396V136H737.5C735.5 165.5 768.1 221 822.5 221V372H1106.5`,
    connectorBeginDelay: "3s",
  },
];

// Phone order: the hub first, then the satellites.
const allFeatures: Feature[] = [planner, ...pieces];

// ---- live numbers -----------------------------------------------------------

// "21:00" → "9 م", "08:30" → "8:30 ص".
const formatClock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const hour12 = h % 12 || 12;
  return `${hour12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "ص" : "م"}`;
};

// One short line per piece from the student's own numbers, or null when
// there's nothing to show.
function statText(key: StatKey, stats: HomeFeatureStats | undefined): string | null {
  if (!stats) return null;
  switch (key) {
    case "planner": {
      const s = stats.planner;
      if (!s) return null;
      if (s.todaySessions === 0) return "لا جلسات اليوم";
      return `أنجزت ${s.completedSessions} من ${s.todaySessions} جلسات اليوم`;
    }
    case "competitions": {
      const rank = stats.competitions?.rank;
      return rank ? `ترتيبك #${rank}` : stats.competitions ? "لم تشارك بعد" : null;
    }
    case "quiz": {
      const score = stats.quiz?.lastScorePercent;
      return score != null ? `آخر نتيجة ${score}%` : stats.quiz ? "ابدأ أول اختبار" : null;
    }
    case "blocker": {
      const s = stats.blocker;
      if (!s) return null;
      return s.activeUntil ? `مفعّل حتى ${formatClock(s.activeUntil)}` : "غير مفعّل الآن";
    }
  }
}

function StatChip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm ${className}`}
    >
      <span className="size-1.5 rounded-full bg-white" />
      {text}
    </span>
  );
}

// ---- desktop puzzle ---------------------------------------------------------

function PieceGradients() {
  return (
    <>
      {allFeatures.map((piece) => (
        <linearGradient
          key={piece.id}
          id={`grad-${piece.id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={piece.gradientFrom} />
          <stop offset="100%" stopColor={piece.gradientTo} />
        </linearGradient>
      ))}
    </>
  );
}

// CSS transform for a lifted piece. In the SVG, lengths are canvas units;
// on the HTML overlay they're pixels, so `unit` (px per canvas unit) is
// passed in there.
const liftTransform = (lifted: boolean, unit = 1) =>
  lifted ? `translateY(${-LIFT * unit}px) scale(${LIFT_SCALE})` : "none";

const boundsCenter = ({ x0, y0, x1, y1 }: Feature["contentBounds"]) => ({
  cx: (x0 + x1) / 2,
  cy: (y0 + y1) / 2,
});

// Opens to its content's height (or closes to nothing) smoothly — the
// grid-rows 0fr → 1fr trick, so no height has to be measured.
function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: open ? 1 : 0,
        transition: `grid-template-rows 450ms ${REVEAL_EASE}, opacity 300ms ease`,
      }}
    >
      {/* Padding keeps the button's shadow from being clipped. */}
      <div className="flex min-h-0 justify-center overflow-hidden p-1">{children}</div>
    </div>
  );
}

// One line of the hover list: rises, un-blurs and fades in, staggered by
// `index`. Closing is quick and all at once, so leaving never feels slow.
function RevealItem({
  open,
  index,
  as: Tag = "div",
  className = "",
  children,
}: {
  open: boolean;
  index: number;
  as?: "div" | "li";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={className}
      style={{
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(8px)",
        filter: open ? "blur(0)" : "blur(4px)",
        transition: open
          ? `opacity 400ms ease, transform 500ms ${REVEAL_EASE}, filter 400ms ease`
          : "opacity 150ms ease, transform 150ms ease, filter 150ms ease",
        transitionDelay: open ? `${120 + index * 80}ms` : "0ms",
      }}
    >
      {children}
    </Tag>
  );
}

function PieceContent({
  piece,
  stat,
  isHovered,
  isDimmed,
  lifted,
  unit,
  onHoverChange,
}: {
  piece: Feature;
  stat: string | null;
  isHovered: boolean;
  isDimmed: boolean;
  lifted: boolean;
  unit: number;
  onHoverChange: (hovering: boolean) => void;
}) {
  const { x0, y0, x1, y1 } = piece.contentBounds;
  const Icon = piece.icon;

  return (
    <Link
      href={piece.href}
      aria-label={`${piece.title}: ${piece.description}`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      className={`absolute rounded-lg outline-none transition-[transform,opacity] duration-300 focus-visible:ring-2 focus-visible:ring-white/80 ${
        isHovered ? "z-10" : ""
      }`}
      style={{
        left: `${(x0 / CANVAS_WIDTH) * 100}%`,
        top: `${(y0 / CANVAS_HEIGHT) * 100}%`,
        width: `${((x1 - x0) / CANVAS_WIDTH) * 100}%`,
        height: `${((y1 - y0) / CANVAS_HEIGHT) * 100}%`,
        transform: liftTransform(lifted, unit),
        opacity: isDimmed ? 0.8 : 1,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-white xl:gap-2.5 xl:px-6">
        <div className="flex items-center gap-2.5">
          <h3 className="whitespace-nowrap text-lg font-bold leading-tight xl:text-2xl">
            {piece.title}
          </h3>
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-transform duration-300 xl:size-10 ${
              isHovered ? "scale-110 rotate-6" : ""
            }`}
          >
            <Icon className="size-5" />
          </span>
        </div>

        {/* Resting: the student's number. Hovered: what the feature does.
            Both stay mounted; each opens or closes its own grid row so the
            title glides into place, and the list's items rise in one after
            another from a soft blur. */}
        {stat && (
          <Reveal open={!isHovered}>
            <StatChip text={stat} />
          </Reveal>
        )}

        <Reveal open={isHovered}>
          <div className="flex flex-col items-center gap-2">
            <ul className="space-y-1 text-start text-[11px] leading-snug text-white/90 xl:text-xs">
              {piece.features.map((feature, i) => (
                <RevealItem key={feature} as="li" open={isHovered} index={i} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3 shrink-0" />
                  {feature}
                </RevealItem>
              ))}
            </ul>
            <RevealItem open={isHovered} index={piece.features.length}>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-zinc-900 shadow-sm xl:text-xs">
                ابدأ الآن <ArrowLeft className="size-3.5" />
              </span>
            </RevealItem>
          </div>
        </Reveal>
      </div>
    </Link>
  );
}

function Puzzle({ stats }: { stats: HomeFeatureStats | undefined }) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Rendered px per canvas unit, so the HTML overlay lifts by the same
  // distance as the SVG shape under it.
  const [unit, setUnit] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setUnit(entry.contentRect.width / CANVAS_WIDTH),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hover = (id: string) => (hovering: boolean) =>
    setHoveredId((current) => (hovering ? id : current === id ? null : current));

  const plannerHovered = hoveredId === planner.id;
  // Hovering the planner (the hub) spotlights the whole puzzle, so nothing fades.
  const isDimmed = (id: string) =>
    hoveredId !== null && !plannerHovered && hoveredId !== id;
  // Satellites lift on their own; the planner lifts with the whole puzzle.
  const liftsAlone = (id: string) => hoveredId === id && id !== planner.id;

  // SVG side of a piece: lifts around its content center (in canvas units),
  // fades when another piece is in the spotlight, clicks through.
  const pieceGroupProps = (piece: Feature) => {
    const { cx, cy } = boundsCenter(piece.contentBounds);
    return {
      onMouseEnter: () => hover(piece.id)(true),
      onMouseLeave: () => hover(piece.id)(false),
      onClick: () => router.push(piece.href),
      className: "cursor-pointer",
      style: {
        transformBox: "view-box" as const,
        transformOrigin: `${cx}px ${cy}px`,
        transform: liftTransform(liftsAlone(piece.id)),
        transition: "transform 300ms ease",
      },
    };
  };

  const shadow = (piece: Feature) =>
    hoveredId === piece.id
      ? `drop-shadow(0 18px 32px ${piece.gradientTo}88)`
      : `drop-shadow(0 8px 20px ${piece.gradientTo}55)`;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        // Planner hovered: the whole puzzle rises together, so every joint
        // stays interlocked.
        transform: plannerHovered
          ? `translateY(${-LIFT * unit}px) scale(${PUZZLE_LIFT_SCALE})`
          : "none",
        transition: "transform 300ms ease",
      }}
    >
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        preserveAspectRatio="none"
        // Lifted pieces at the canvas edge would otherwise be clipped.
        overflow="visible"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <PieceGradients />
          <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <clipPath id="clip-planner">
            <rect {...planner.rect} />
          </clipPath>
          {pieces.map((piece) => (
            <clipPath key={piece.id} id={`clip-${piece.id}`}>
              <path d={piece.path} />
            </clipPath>
          ))}
        </defs>

        {/* planner — plain rectangle, the satellite pieces overlap it */}
        <g {...pieceGroupProps(planner)}>
          <g
            style={{
              filter: `${shadow(planner)}${isDimmed(planner.id) ? ` ${DIM_FILTER}` : ""}`,

              transition: "filter 300ms",
            }}
          >
            <rect {...planner.rect} fill="url(#grad-planner)" />
            <g clipPath="url(#clip-planner)">
              <rect
                x={planner.contentBounds.x0 - 260}
                y={planner.contentBounds.y0 - 60}
                width={140}
                height={planner.contentBounds.y1 - planner.contentBounds.y0 + 120}
                fill="url(#shine-gradient)"
                style={{ animation: "magic-shine 5s ease-in-out infinite" }}
              />
            </g>
          </g>
        </g>

        {pieces.map((piece) => {
          const isHovered = piece.id === hoveredId;
          // Hovering the planner (the hub) lights every connector.
          const isLit = isHovered || plannerHovered;
          const pulseCount = isLit ? PULSES_PER_CONNECTOR_HOVER : PULSES_PER_CONNECTOR;
          const pulseDuration = isLit ? PULSE_DURATION_SECONDS_HOVER : PULSE_DURATION_SECONDS;

          return (
            <g key={piece.id}>
              <g {...pieceGroupProps(piece)}>
                {/* halo behind the bump, creating the socket-ring glow —
                    fill tracks the theme background so it blends in on the
                    page background instead of always being white. It moves
                    with the piece but never fades, so the ring stays. */}
                <circle
                  cx={piece.halo.cx}
                  cy={piece.halo.cy}
                  r={piece.halo.r}
                  className="fill-[var(--background)]"
                />

                <g
                  style={{
                    filter: `${shadow(piece)}${isDimmed(piece.id) ? ` ${DIM_FILTER}` : ""}`,

                    transition: "filter 300ms",
                  }}
                >
                  <path d={piece.path} fill={`url(#grad-${piece.id})`} />

                  <g clipPath={`url(#clip-${piece.id})`}>
                    <rect
                      x={piece.contentBounds.x0 - 260}
                      y={piece.contentBounds.y0 - 60}
                      width={140}
                      height={piece.contentBounds.y1 - piece.contentBounds.y0 + 120}
                      fill="url(#shine-gradient)"
                      style={{
                        animation: "magic-shine 5s ease-in-out infinite",
                        animationDelay: piece.shimmerDelay,
                      }}
                    />
                  </g>
                </g>
              </g>

              {/* connector trace looping from this piece through the
                  planner's interior and back into this piece, with glowing
                  pulses traveling along it. Hovering this piece lights its
                  own connector in the piece's color; the others fade. */}
              <path
                id={`connector-${piece.id}`}
                d={piece.connectorPath}
                fill="none"
                stroke={isHovered ? piece.gradientFrom : "#FDE68A"}
                strokeOpacity={isLit ? 0.75 : hoveredId ? 0.12 : 0.3}
                strokeWidth={isLit ? 3 : 2}
                className="pointer-events-none transition-[stroke-opacity,stroke-width,stroke] duration-300"
              />
              {getPulseBeginTimes(piece.connectorBeginDelay, pulseCount, pulseDuration).map(
                (begin, i) => (
                  // Keying on isLit forces these SMIL animations to remount
                  // (instead of just re-rendering their attributes) so the
                  // new dur/begin actually take effect immediately.
                  <g key={`${isLit}-${i}`} className="pointer-events-none">
                    <animateMotion
                      dur={`${pulseDuration}s`}
                      repeatCount="indefinite"
                      begin={begin}
                      rotate="auto"
                    >
                      <mpath href={`#connector-${piece.id}`} />
                    </animateMotion>
                    {/* bright core — reads as a glowing stretch of the
                        line itself rather than a separate dot shape */}
                    <rect
                      x={-11}
                      y={-1.5}
                      width={20}
                      height={3}
                      rx={1.5}
                      fill="#FEF9C3"
                      opacity={isLit ? 0.8 : 0.3}
                    />
                  </g>
                ),
              )}
            </g>
          );
        })}
      </svg>

      {allFeatures.map((piece) => (
        <PieceContent
          key={piece.id}
          piece={piece}
          stat={statText(piece.statKey, stats)}
          isHovered={hoveredId === piece.id}
          isDimmed={isDimmed(piece.id)}
          lifted={liftsAlone(piece.id)}
          unit={unit}
          onHoverChange={hover(piece.id)}
        />
      ))}
    </div>
  );
}

// ---- phone / tablet cards ---------------------------------------------------

// Below desktop width the puzzle would shrink until its text is unreadable,
// and there's no hover — so each feature is a card you tap to open.
function FeatureCards({ stats }: { stats: HomeFeatureStats | undefined }) {
  return (
    <div dir="rtl" className="grid gap-4 sm:grid-cols-2">
      {allFeatures.map((piece) => {
        const Icon = piece.icon;
        const stat = statText(piece.statKey, stats);
        return (
          <Link
            key={piece.id}
            href={piece.href}
            className="group relative overflow-hidden rounded-3xl p-5 text-white shadow-lg transition active:scale-[0.98] sm:first:col-span-2"
            style={{
              backgroundImage: `linear-gradient(135deg, ${piece.gradientFrom}, ${piece.gradientTo})`,
              boxShadow: `0 10px 24px ${piece.gradientTo}40`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{piece.title}</h3>
                  <p className="mt-0.5 text-sm text-white/85">{piece.description}</p>
                </div>
              </div>
              <ArrowLeft className="mt-1 size-5 shrink-0 opacity-80 transition-transform group-hover:-translate-x-1" />
            </div>

            <ul className="mt-4 space-y-1.5 text-sm text-white/90">
              {piece.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {stat && <StatChip text={stat} className="mt-4" />}
          </Link>
        );
      })}
    </div>
  );
}

export default function MagicSection() {
  const { data: stats } = useHomeFeatureStats();

  return (
    <section className="w-full">
      <div className="mx-auto mt-24 max-w-7xl px-4 py-16 sm:px-6 lg:mt-40 lg:px-12">
        <div className="lg:hidden">
          <FeatureCards stats={stats} />
        </div>
        <div className="hidden lg:block">
          <Puzzle stats={stats} />
        </div>
      </div>

      <style>{`
        @keyframes magic-shine {
          0%, 15% { transform: translateX(0) rotate(20deg); }
          50% { transform: translateX(${CANVAS_WIDTH + 200}px) rotate(20deg); }
          100% { transform: translateX(${CANVAS_WIDTH + 200}px) rotate(20deg); }
        }
      `}</style>
    </section>
  );
}
