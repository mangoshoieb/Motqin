"use client";

import { useState } from "react";
import { Bot, BookOpen, CalendarCheck, LucideIcon, Trophy } from "lucide-react";
import Link from "next/link";

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

function getPulseBeginTimes(
  baseDelay: string,
  count: number,
  duration: number
): string[] {
  const base = parseFloat(baseDelay) || 0;
  const stagger = duration / count;
  return Array.from({ length: count }, (_, i) => `${base + i * stagger}s`);
}

interface PuzzlePiece {
  id: string;
  // Exact silhouette path, ported from the reference design (not
  // regenerated), so bumps/corners match the source pixel-for-pixel.
  path: string;
  // Where the icon/title/description sit — the piece's main rectangular
  // body, excluding its bump/socket geometry so text doesn't collide with it.
  contentBounds: { x0: number; y0: number; x1: number; y1: number };
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  gradientFrom: string;
  gradientTo: string;
  shimmerDelay: string;
  // White halo circle rendered behind this piece, at the joint where it
  // overlaps the planner piece — creates the "socket ring" glow.
  halo: { cx: number; cy: number; r: number };
  // Connector trace from this piece's joint, looping through the planner's
  // interior and back into this same piece.
  connectorPath: string;
  connectorBeginDelay: string;
}

const planner = {
  // Plain rounded rectangle — the satellite pieces render on top of it and
  // simply overlap its edges to create the interlock illusion, so it needs
  // no bump/notch geometry of its own.
  rect: { x: 264, y: 73, width: 612, height: 350, rx: 9 },
  contentBounds: { x0: 314, y0: 80, x1: 876, y1: 423 },
  title: "المخطط",
  description: "خطط لجلسات مذاكرتك وتابع تقدمك اليومي",
  icon: CalendarCheck,
  href: "/planner",
  gradientFrom: "#3b82f6",
  gradientTo: "#1d4ed8",
};

const pieces: PuzzlePiece[] = [
  {
    id: "competitions",
    path: `M246 73C250.971 73 255 77.029 255 82V174.205C292.471 177.016 322 208.31 322 246.5C322 284.69 292.471 315.983 255 318.794V414C255 418.971 250.971 423 246 423H9C4.029 423 0 418.971 0 414V82C0 77.029 4.029 73 9 73H246Z`,
    contentBounds: { x0: 20, y0: 80, x1: 266, y1: 423 },
    title: "المسابقات",
    description: "نافس أصدقاءك وتصدر لوحة الترتيب",
    icon: Trophy,
    href:"/competitions",
    gradientFrom: "#fbbf24",
    gradientTo: "#d97706",
    shimmerDelay: "0s",
    halo: { cx: 249.5, cy: 246.5, r: 82.5 },
    connectorPath: `M112.5 88.5V193L728 191.124V308H112.5V402.5`,
    connectorBeginDelay: "0s",
  },
  {
    id: "ai-teacher",
    path: `M1137 0C1141.97 0 1146 4.029 1146 9V189C1146 193.971 1141.97 198 1137 198H883.5V142.7C875.4 167.833 851.83 186.018 824 186.018C789.48 186.018 761.5 158.035 761.5 123.518C761.5 100.469 773.977 80.336 792.54 69.5H766V9C766 4.029 770.029 0 775 0H1137Z`,
    contentBounds: { x0: 883.5, y0: 0, x1: 1146, y1: 198 },
    title: "دليل",
    description: "احصل على مساعدة فورية",
    icon: Bot,
    href: "/subjects",
    gradientFrom: "#c084fc",
    gradientTo: "#9333ea",
    shimmerDelay: "1.5s",
    halo: { cx: 824, cy: 123, r: 69 },
    connectorPath: `M1100 41.5C873.6 41.5 816.33 41.5 816 41.5V110H389.5V368H731C731 339 761.6 283 816 283V132H1100`,
    connectorBeginDelay: "2s",
  },
  {
    id: "quiz",
    path: `M1137 497C1141.97 497 1146 492.971 1146 488V308C1146 303.029 1141.97 299 1137 299H883.5V354.3C875.4 329.167 851.83 310.982 824 310.982C789.48 310.982 761.5 338.965 761.5 373.482C761.5 396.531 773.977 416.664 792.54 427.5H766V488C766 492.971 770.029 497 775 497H1137Z`,
    contentBounds: { x0: 883.5, y0: 339, x1: 1146, y1: 497 },
    title: "متقن",
    description: "قيّم مستواك بأسئلة تفاعلية",
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

function PieceGradients() {
  return (
    <>
      <linearGradient id="grad-planner" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={planner.gradientFrom} />
        <stop offset="100%" stopColor={planner.gradientTo} />
      </linearGradient>
      {pieces.map((piece) => (
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

function PieceContent({
  piece,
  onHoverChange,
}: {
  piece: (typeof pieces)[number] | typeof planner;
  onHoverChange?: (hovering: boolean) => void;
}) {
  const { x0, y0, x1, y1 } = piece.contentBounds;
  const Icon = piece.icon;

  const content = (
    <div className="group flex h-full w-full flex-col items-center justify-center gap-2 px-8 text-center text-white">
      <div className="flex items-center gap-2.5">
        <h3 className="text-xl font-bold leading-tight md:text-2xl">
          {piece.title}
        </h3>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="max-w-[220px] text-xs leading-snug text-white/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:text-sm">
        {piece.description}
      </p>
    </div>
  );

  const style: React.CSSProperties = {
    left: `${(x0 / CANVAS_WIDTH) * 100}%`,
    top: `${(y0 / CANVAS_HEIGHT) * 100}%`,
    width: `${((x1 - x0) / CANVAS_WIDTH) * 100}%`,
    height: `${((y1 - y0) / CANVAS_HEIGHT) * 100}%`,
  };

  const hoverHandlers = onHoverChange
    ? {
        onMouseEnter: () => onHoverChange(true),
        onMouseLeave: () => onHoverChange(false),
      }
    : undefined;

  return piece.href ? (
    <Link href={piece.href} className="absolute" style={style} {...hoverHandlers}>
      {content}
    </Link>
  ) : (
    <div className="absolute" style={style} {...hoverHandlers}>
      {content}
    </div>
  );
}

export default function MagicSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="w-full">
      <div className="max-w-7xl mt-40 mx-auto px-6 md:px-12 py-16">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
        >
          <svg
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <PieceGradients />
              <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="50%" stopColor="white" stopOpacity="0.35" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <filter id="pulse-blur" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
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
            <g style={{ filter: `drop-shadow(0 8px 20px ${planner.gradientTo}55)` }}>
              <rect {...planner.rect} fill="url(#grad-planner)" />
              <g clipPath="url(#clip-planner)">
                <rect
                  x={planner.contentBounds.x0 - 260}
                  y={planner.contentBounds.y0 - 60}
                  width={140}
                  height={
                    planner.contentBounds.y1 - planner.contentBounds.y0 + 120
                  }
                  fill="url(#shine-gradient)"
                  style={{ animation: "magic-shine 5s ease-in-out infinite" }}
                />
              </g>
            </g>

            {pieces.map((piece) => {
              const isHovered = piece.id === hoveredId;
              const pulseCount = isHovered
                ? PULSES_PER_CONNECTOR_HOVER
                : PULSES_PER_CONNECTOR;
              const pulseDuration = isHovered
                ? PULSE_DURATION_SECONDS_HOVER
                : PULSE_DURATION_SECONDS;

              return (
              <g key={piece.id}>
                {/* halo behind the bump, creating the socket-ring glow —
                    fill tracks the theme background so it blends in on the
                    ambient page background instead of always being white */}
                <circle
                  cx={piece.halo.cx}
                  cy={piece.halo.cy}
                  r={piece.halo.r}
                  className="fill-[var(--background)]"
                />

                <g
                  className="transition-[filter] duration-300 hover:brightness-110"
                  style={{
                    filter: `drop-shadow(0 8px 20px ${piece.gradientTo}55)`,
                  }}
                >
                  <path d={piece.path} fill={`url(#grad-${piece.id})`} />

                  <g clipPath={`url(#clip-${piece.id})`}>
                    <rect
                      x={piece.contentBounds.x0 - 260}
                      y={piece.contentBounds.y0 - 60}
                      width={140}
                      height={
                        piece.contentBounds.y1 - piece.contentBounds.y0 + 120
                      }
                      fill="url(#shine-gradient)"
                      style={{
                        animation: "magic-shine 5s ease-in-out infinite",
                        animationDelay: piece.shimmerDelay,
                      }}
                    />
                  </g>
                </g>

                {/* connector trace looping from this piece through the
                    planner's interior and back into this piece, with a
                    glowing pulse traveling along it — hovering this piece
                    swaps its own connector to more, faster pulses */}
                <path
                  id={`connector-${piece.id}`}
                  d={piece.connectorPath}
                  fill="none"
                  stroke="#FDE68A"
                  strokeOpacity={isHovered ? 0.4 : 0.3}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-[stroke-opacity,stroke-width] duration-300"
                />
                {getPulseBeginTimes(
                  piece.connectorBeginDelay,
                  pulseCount,
                  pulseDuration
                ).map((begin, i) => (
                  // Keying on isHovered forces these SMIL animations to
                  // remount (instead of just re-rendering their attributes)
                  // so the new dur/begin actually take effect immediately.
                  <g key={`${isHovered}-${i}`}>
                    <animateMotion
                      dur={`${pulseDuration}s`}
                      repeatCount="indefinite"
                      begin={begin}
                      rotate="auto"
                    >
                      <mpath href={`#connector-${piece.id}`} />
                    </animateMotion>
                    {/* soft colored glow halo behind the bar */}
                    {/* <rect
                      x={-17}
                      y={-3.5}
                      width={34}
                      height={7}
                      rx={3.5}
                      fill={piece.gradientFrom}
                      opacity={0.55}
                      filter="url(#pulse-blur)"
                    /> */}
                    {/* bright core — reads as a glowing stretch of the
                        line itself rather than a separate dot shape */}
                    <rect
                      x={-11}
                      y={-1.5}
                      width={20}
                      height={3}
                      rx={1.5}
                      fill="#FEF9C3"
                      opacity={isHovered ? 0.5 : 0.3}
                    />
                  </g>
                ))}
              </g>
              );
            })}
          </svg>

          <PieceContent piece={planner} />
          {pieces.map((piece) => (
            <PieceContent
              key={piece.id}
              piece={piece}
              onHoverChange={(hovering) =>
                setHoveredId(hovering ? piece.id : null)
              }
            />
          ))}
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
