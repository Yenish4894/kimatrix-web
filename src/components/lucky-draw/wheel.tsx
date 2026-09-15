import { cn } from "@/lib/utils";
import { SPIN_EASING_CSS } from "@/lib/draw-sound";

export const WHEEL_SEGMENTS = 10;
const SEGMENT_COLOURS = ["#0891B2", "#0E7490", "#14B8A6", "#0F766E"];

/**
 * The lucky-draw wheel. Purely decorative: it rotates to `rotation` over `durationMs`
 * and the winner (already chosen by the server) is revealed by the caller afterwards.
 */
export function Wheel({
  rotation,
  durationMs,
  className,
  pointerClassName,
}: Readonly<{
  rotation: number;
  durationMs: number;
  /** Size of the wheel box, e.g. `h-64 w-64`. */
  className?: string;
  /** Pointer triangle size/colour. */
  pointerClassName?: string;
}>) {
  return (
    <div className={cn("relative", className)}>
      {/* Pointer */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 -top-1 z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent border-t-slate-800",
          pointerClassName,
        )}
      />
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="h-full w-full drop-shadow-md transition-transform motion-reduce:transition-none"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: SPIN_EASING_CSS,
        }}
      >
        {Array.from({ length: WHEEL_SEGMENTS }, (_, i) => {
          const a0 = (i / WHEEL_SEGMENTS) * 2 * Math.PI;
          const a1 = ((i + 1) / WHEEL_SEGMENTS) * 2 * Math.PI;
          const x0 = 100 + 98 * Math.sin(a0), y0 = 100 - 98 * Math.cos(a0);
          const x1 = 100 + 98 * Math.sin(a1), y1 = 100 - 98 * Math.cos(a1);
          return (
            <path
              key={i}
              d={`M100,100 L${x0},${y0} A98,98 0 0,1 ${x1},${y1} Z`}
              fill={SEGMENT_COLOURS[i % SEGMENT_COLOURS.length]}
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}
        <circle cx="100" cy="100" r="22" fill="#fff" />
        <text x="100" y="105" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0E7490">
          SPIN
        </text>
      </svg>
    </div>
  );
}
