"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { WHEEL_SEGMENTS } from "@/components/lucky-draw/wheel";
import { DrawSound, tickTimes } from "@/lib/draw-sound";

// ── Mute preference, shared by the Lucky Draw page and Draw mode ─────────────

const MUTE_KEY = "kimates.drawMode.muted";
const muteListeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    // Sound is ON unless this browser was muted. (It used to default to muted, so the
    // spin music was never heard unless someone found the speaker button.)
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSpinSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode / blocked storage — the choice just isn't remembered */
  }
  muteListeners.forEach((l) => l());
}

function subscribeMuted(cb: () => void) {
  muteListeners.add(cb);
  return () => {
    muteListeners.delete(cb);
  };
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * The spin music and the winner fanfare for one wheel.
 *
 * Music starts with each new spin and fades out as the wheel stops; the fanfare plays
 * when `celebrateKey` changes to a new value. `active: false` keeps the wheel silent
 * (the page's own wheel while Draw mode is open over it, so the two never play at once).
 * Audio can only start inside a click, so call `unlock()` from the Spin button handler.
 */
export function useSpinSound({
  rotation,
  spinning,
  spinDurationMs,
  celebrateKey,
  active = true,
}: {
  rotation: number;
  spinning: boolean;
  spinDurationMs: number;
  /** A new winner's id once the wheel has revealed it; null otherwise. */
  celebrateKey: string | null;
  active?: boolean;
}) {
  const soundRef = useRef<DrawSound | null>(null);
  const muted = useSyncExternalStore(subscribeMuted, readMuted, () => false);
  const reducedMotion = usePrefersReducedMotion();
  // Read by the effects below, which must not re-run (and replay sound) when these
  // change. Synced in an effect declared first, so it runs before them.
  const live = useRef({ muted, active });
  useEffect(() => {
    live.current = { muted, active };
  });

  // Download the music on mount so it is ready by the first spin; release on unmount.
  useEffect(() => {
    const sound = new DrawSound();
    sound.preloadMusic();
    soundRef.current = sound;
    return () => {
      sound.close();
      soundRef.current = null;
    };
  }, []);

  // Each new wheel target starts the spin sound.
  const prevRotation = useRef(rotation);
  useEffect(() => {
    const delta = rotation - prevRotation.current;
    prevRotation.current = rotation;
    const { muted: isMuted, active: isActive } = live.current;
    // With reduced motion the wheel lands at once: no music over a still wheel.
    if (delta > 0 && spinning && isActive && !isMuted && !reducedMotion && soundRef.current?.ready) {
      soundRef.current.playSpin(spinDurationMs, tickTimes(delta, spinDurationMs, WHEEL_SEGMENTS));
    }
  }, [rotation, spinning, spinDurationMs, reducedMotion]);

  // The wheel has stopped (or a refused spin stopped it early): end the spin sound.
  useEffect(() => {
    if (!spinning) soundRef.current?.stopSpin();
  }, [spinning]);

  // Muting, or handing over to Draw mode, silences what is playing.
  useEffect(() => {
    if (muted || !active) soundRef.current?.stopSpin();
  }, [muted, active]);

  // Fanfare for a newly revealed winner.
  useEffect(() => {
    const { muted: isMuted, active: isActive } = live.current;
    if (celebrateKey && isActive && !isMuted) soundRef.current?.playFanfare();
  }, [celebrateKey]);

  return {
    muted,
    /** Call inside the Spin click: the only moment browsers let audio start. */
    unlock: () => {
      if (!live.current.muted) soundRef.current?.ensure();
    },
    toggleMuted: () => {
      const next = !muted;
      setSpinSoundMuted(next);
      if (!next) soundRef.current?.ensure();
    },
  };
}
