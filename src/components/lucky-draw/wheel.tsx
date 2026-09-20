"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { SPIN_EASING_CSS } from "@/lib/draw-sound";

/**
 * Even, so the gift/name alternation closes cleanly at the top, and small enough
 * that the wordmark still fits along a segment's radius on a phone.
 */
export const WHEEL_SEGMENTS = 12;

const NAME_FILL = "#0E7490"; // cyan-700 — white text on it clears WCAG AA
const GIFT_FILL = "#F59E0B"; // accent — the same amber as the pointer and the trophy
const GIFT_GLYPH = "#134E4A";
const SEG_R = 92;
const PEG_R = 87; // inside the rim, so the static bezel cannot paint over them

/** Two flaps closer together than this read as a blur, so the later one is dropped. */
const MIN_FLAP_GAP_MS = 90;

const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [100 + r * Math.sin(a), 100 - r * Math.cos(a)] as const;
};

/** A small wrapped-gift glyph, drawn around its own origin with "up" = -y. */
function GiftGlyph({ deg }: Readonly<{ deg: number }>) {
  const [x, y] = point(deg, 58);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg})`} fill={GIFT_GLYPH}>
      <rect x="-9" y="-3" width="18" height="13" rx="1.5" />
      <rect x="-10.5" y="-7.5" width="21" height="5" rx="1.5" />
      <rect x="-1.75" y="-7.5" width="3.5" height="17.5" fill={GIFT_FILL} />
      <path d="M-1.5,-8 C-7,-8 -8.5,-14 -4.5,-14 C-1.5,-14 -0.5,-10.5 -0.5,-8 Z" />
      <path d="M1.5,-8 C7,-8 8.5,-14 4.5,-14 C1.5,-14 0.5,-10.5 0.5,-8 Z" />
    </g>
  );
}

/**
 * The wordmark, set along the segment's radius, reading outward from the hub.
 *
 * Every label radiates the same way rather than being flipped upright on one half:
 * the wheel stops at an arbitrary angle, so a per-half flip looks upright at rest
 * and mirrored the moment it lands anywhere else. Radiating is angle-independent.
 */
function SegmentWord({ deg }: Readonly<{ deg: number }>) {
  return (
    <g transform={`translate(100 100) rotate(${deg - 90})`}>
      <text
        x="56"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.5"
        fill="#FFFFFF"
      >
        KIMates
      </text>
    </g>
  );
}

/**
 * The lucky-draw wheel. Purely decorative: it rotates to `rotation` over `durationMs`
 * and the winner (already chosen by the server) is revealed by the caller afterwards.
 *
 * Only the segments and their pegs rotate. The bezel, the gloss and the hub are a
 * separate, static overlay, so "SPIN" stays readable and the rim stays put.
 */
export function Wheel({
  rotation,
  durationMs,
  spinning = false,
  flapMs,
  className,
  pointerClassName,
}: Readonly<{
  rotation: number;
  durationMs: number;
  /** Pauses the idle drift and arms the pointer while a spin is running. */
  spinning?: boolean;
  /** Times (ms from now) at which a peg passes the pointer, so it can flap. */
  flapMs?: number[];
  /** Size of the wheel box, e.g. `h-64 w-64`. */
  className?: string;
  /** Pointer size/colour. */
  pointerClassName?: string;
}>) {
  const pointerRef = useRef<SVGGElement | null>(null);

  // ── Pointer flap: one kick per peg, on the same schedule as the tick sounds ──
  useEffect(() => {
    const el = pointerRef.current;
    if (!el || !flapMs?.length || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let last = -Infinity;
    for (const ms of flapMs) {
      if (ms - last < MIN_FLAP_GAP_MS) continue;
      last = ms;
      timers.push(
        setTimeout(() => {
          el.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: "rotate(-15deg)" },
              { transform: "rotate(0deg)" },
            ],
            { duration: 130, easing: "ease-out" },
          );
        }, ms),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [flapMs]);

  const step = 360 / WHEEL_SEGMENTS;

  return (
    <div className={cn("relative", className)}>
      {/* Rotating disc */}
      <div
        className="h-full w-full motion-safe:animate-[wheel-drift_90s_linear_infinite]"
        style={{ animationPlayState: spinning ? "paused" : "running" }}
      >
        <svg
          viewBox="0 0 200 200"
          aria-hidden="true"
          className="h-full w-full transition-transform motion-reduce:transition-none"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: `${durationMs}ms`,
            transitionTimingFunction: SPIN_EASING_CSS,
          }}
        >
          {Array.from({ length: WHEEL_SEGMENTS }, (_, i) => {
            const [x0, y0] = point(i * step, SEG_R);
            const [x1, y1] = point((i + 1) * step, SEG_R);
            return (
              <path
                key={i}
                d={`M100,100 L${x0.toFixed(2)},${y0.toFixed(2)} A${SEG_R},${SEG_R} 0 0,1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`}
                fill={i % 2 === 0 ? NAME_FILL : GIFT_FILL}
                stroke="#FFFFFF"
                strokeWidth="1.25"
              />
            );
          })}

          {Array.from({ length: WHEEL_SEGMENTS }, (_, i) =>
            i % 2 === 0 ? (
              <SegmentWord key={i} deg={(i + 0.5) * step} />
            ) : (
              <GiftGlyph key={i} deg={(i + 0.5) * step} />
            ),
          )}

          {/* Pegs sit on the wheel, so they pass the pointer at segment boundaries */}
          {Array.from({ length: WHEEL_SEGMENTS }, (_, i) => {
            const [x, y] = point(i * step, PEG_R);
            return (
              <circle
                key={i}
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r="2.6"
                fill="#FFFBEB"
                stroke="#B45309"
                strokeWidth="0.8"
              />
            );
          })}
        </svg>
      </div>

      {/* Static overlay: gloss, bezel, hub */}
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-lg"
      >
        <defs>
          <linearGradient id="wheel-bezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <radialGradient id="wheel-gloss" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="92" fill="url(#wheel-gloss)" />
        <circle cx="100" cy="100" r="96" fill="none" stroke="url(#wheel-bezel)" strokeWidth="7" />
        <circle cx="100" cy="100" r="99.5" fill="none" stroke="#78350F" strokeWidth="0.75" opacity="0.5" />

        <circle cx="100" cy="100" r="23" fill="#FFFFFF" />
        <circle cx="100" cy="100" r="23" fill="none" stroke="url(#wheel-bezel)" strokeWidth="3" />
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12"
          fontWeight="800"
          letterSpacing="1"
          fill={NAME_FILL}
        >
          SPIN
        </text>
      </svg>

      {/* Pointer / flapper, pivoting from its tip at the rim */}
      <svg
        viewBox="0 0 40 46"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/2 top-0 z-10 h-[18%] w-[18%] -translate-x-1/2 -translate-y-[60%] drop-shadow",
          pointerClassName,
        )}
      >
        <g ref={pointerRef} style={{ transformOrigin: "20px 6px", transformBox: "view-box" }}>
          <circle cx="20" cy="8" r="7" fill="#B45309" />
          <circle cx="20" cy="8" r="3.5" fill="#FDE68A" />
          <path
            d="M11,10 L29,10 L20,44 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
