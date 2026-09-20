"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Gift, Trophy, Volume2, VolumeX, X } from "lucide-react";

import { Button } from "@/components/ui";
import { Wheel, WHEEL_SEGMENTS } from "@/components/lucky-draw/wheel";
import { Confetti } from "@/components/lucky-draw/confetti";
import { DrawSound, tickTimes } from "@/lib/draw-sound";
import { maskMobile } from "@/lib/mask-mobile";
import { formatNumber } from "@/lib/utils";
import type { LuckyDrawSpinResult } from "@/types";

const MUTE_KEY = "kimates.drawMode.muted";

function readMuted(): boolean {
  try {
    // Default muted: nothing may make noise until someone asks for it.
    return localStorage.getItem(MUTE_KEY) !== "0";
  } catch {
    return true;
  }
}

function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode / blocked storage — the choice just isn't remembered */
  }
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export interface DrawModeProps {
  onClose: () => void;
  companyName: string;
  rotation: number;
  spinDurationMs: number;
  spinning: boolean;
  result: LuckyDrawSpinResult | null;
  spinsLeft: number;
  canSpin: boolean;
  /** Why a spin isn't possible (other than "no spins left"), if anything. */
  blocker: string | null;
  onSpin: () => void;
}

/**
 * Full-screen "Draw mode" for running the lucky draw on a customer-facing TV.
 *
 * Mounted only while open. It owns presentation only — the spin itself is the page's
 * mutation (`onSpin`), so the winner is still picked on the server before the wheel
 * moves, exactly as on the normal page.
 *
 * PRIVACY: this is a public screen. It shows the winner's name and a masked mobile
 * only — never the invoice, amount, vehicle or full number.
 */
export function DrawMode({
  onClose,
  companyName,
  rotation,
  spinDurationMs,
  spinning,
  result,
  spinsLeft,
  canSpin,
  blocker,
  onSpin,
}: Readonly<DrawModeProps>) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const spinBtnRef = useRef<HTMLButtonElement | null>(null);
  const soundRef = useRef<DrawSound | null>(null);
  const [muted, setMuted] = useState(readMuted);
  const mutedRef = useRef(muted);
  const reducedMotion = usePrefersReducedMotion();

  // A result that already existed when draw mode opened is shown, but not celebrated.
  const [initialDrawId] = useState(() => result?.drawId);
  const freshWin = result !== null && result.drawId !== initialDrawId;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ── Open/close lifecycle: fullscreen, scroll lock, focus, Esc, audio cleanup ──
  useEffect(() => {
    const el = overlayRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    spinBtnRef.current?.focus();

    let enteredFullscreen = false;
    const onFsChange = () => {
      if (document.fullscreenElement === el) enteredFullscreen = true;
      else if (enteredFullscreen && !document.fullscreenElement) onCloseRef.current();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    if (el && typeof el.requestFullscreen === "function" && document.fullscreenEnabled !== false) {
      // Denied or unsupported → we simply stay a fixed overlay.
      el.requestFullscreen().catch(() => {});
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && el) {
        const focusables = Array.from(
          el.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"),
        );
        if (focusables.length === 0) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!el.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", onKey);
      if (document.fullscreenElement === el) void document.exitFullscreen().catch(() => {});
      document.body.style.overflow = prevOverflow;
      soundRef.current?.close();
      soundRef.current = null;
      previouslyFocused?.focus?.();
    };
  }, []);

  // ── Ticks: scheduled when the wheel is given a new target ──
  // The same schedule drives the sound and the pointer's flap, so a peg passing the
  // pointer looks and sounds like one event.
  const [flapMs, setFlapMs] = useState<number[] | undefined>(undefined);
  const prevRotation = useRef(rotation);
  useEffect(() => {
    const delta = rotation - prevRotation.current;
    prevRotation.current = rotation;
    // With reduced motion the wheel lands at once, so a 4.5s drumroll would tick over a
    // still wheel. Skip it; the fanfare on the reveal still plays.
    if (delta > 0 && spinning && !reducedMotion) {
      const times = tickTimes(delta, spinDurationMs, WHEEL_SEGMENTS);
      setFlapMs(times);
      if (!mutedRef.current && soundRef.current?.ready) soundRef.current.playTicks(times);
    }
  }, [rotation, spinning, spinDurationMs, reducedMotion]);

  // A refused spin stops the wheel early — don't keep ticking or flapping.
  useEffect(() => {
    if (!spinning) {
      soundRef.current?.stopTicks();
      setFlapMs(undefined);
    }
  }, [spinning]);

  // ── Fanfare when a new winner is revealed ──
  useEffect(() => {
    if (freshWin && !mutedRef.current) soundRef.current?.playFanfare();
  }, [freshWin, result?.drawId]);

  const ensureSound = () => {
    if (!soundRef.current) soundRef.current = new DrawSound();
    return soundRef.current.ensure();
  };

  const handleSpin = () => {
    // Inside the click: the only moment browsers let us start audio.
    if (!mutedRef.current) ensureSound();
    onSpin();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    saveMuted(next);
    if (next) soundRef.current?.stopTicks();
    else ensureSound();
  };

  const noSpinsLeft = spinsLeft <= 0;
  const maskedMobile = result ? maskMobile(result.winner.mobile) : "";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex flex-col overflow-x-hidden overflow-y-auto bg-gradient-to-b from-primary-950 via-slate-900 to-slate-950 text-white"
    >
      {freshWin && !reducedMotion && <Confetti key={result.drawId} />}

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        <Image
          src="/brand/kimates-logo-white.png"
          alt="KIMates"
          width={194}
          height={51}
          priority
          className="h-8 w-auto sm:h-11"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={!muted}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
          >
            {muted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
            <span className="hidden sm:inline">{muted ? "Sound off" : "Sound on"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-300"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            Exit
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-4 text-center sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-300 sm:text-sm">
          Lucky Draw
        </p>
        {/* text-white is explicit: globals.css sets every heading to near-black (#111827),
          which on this dark overlay rendered the company name almost invisible. */}
        <h2 id={titleId} className="mt-1 break-words text-2xl font-bold text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
          {companyName || "Lucky Draw"}
        </h2>
      </div>

      {/* Stage */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-6 sm:px-8 lg:flex-row lg:gap-16">
        <Wheel
          rotation={rotation}
          durationMs={spinDurationMs}
          flapMs={flapMs}
          className="h-[min(78vw,56vh)] w-[min(78vw,56vh)] shrink-0"
          pointerClassName="drop-shadow-lg"
        />

        <div className="flex w-full max-w-md flex-col items-center text-center">
          <Button
            ref={spinBtnRef}
            size="lg"
            variant="accent"
            onClick={handleSpin}
            disabled={!canSpin}
            isLoading={spinning}
            className="h-16 w-full max-w-xs text-xl sm:h-20 sm:text-2xl"
          >
            {!spinning && <Gift className="h-6 w-6" aria-hidden="true" />}
            {spinning ? "Drawing…" : noSpinsLeft ? "No spins left" : "Spin"}
          </Button>
          <p className="mt-3 text-base text-slate-300 sm:text-lg">
            {noSpinsLeft ? (
              "No spins left"
            ) : (
              <>
                <strong className="text-white">{formatNumber(spinsLeft)}</strong>{" "}
                {spinsLeft === 1 ? "spin" : "spins"} left
              </>
            )}
          </p>
          {blocker && !noSpinsLeft && !spinning && (
            <p className="mt-2 max-w-xs text-sm text-slate-400">{blocker}</p>
          )}

          <div aria-live="polite" className="mt-6 w-full">
            {result && !spinning && (
              <div className="w-full rounded-2xl bg-white p-6 text-slate-900 shadow-2xl motion-safe:animate-[draw-pop_450ms_cubic-bezier(0.34,1.56,0.64,1)] sm:p-8">
                <Trophy className="mx-auto h-10 w-10 text-accent-500 sm:h-12 sm:w-12" aria-hidden="true" />
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-accent-600 sm:text-5xl">
                  Winner!
                </p>
                <p className="mt-3 break-words text-2xl font-bold sm:text-4xl">{result.winner.fullName}</p>
                {maskedMobile && (
                  <p className="mt-1 font-mono text-lg tracking-wider text-slate-600 sm:text-2xl">
                    <span className="sr-only">Mobile ending </span>
                    {maskedMobile}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
