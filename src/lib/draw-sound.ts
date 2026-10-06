/**
 * Sound for the lucky-draw "Draw mode", played through the Web Audio API.
 *
 * While the wheel spins, a music clip plays (public/sounds/lucky-draw-spin.mp3: the
 * first 16s of the track, cut on MP3 frame boundaries). It fades out as the wheel stops.
 * Until the clip has downloaded and decoded, the generated ticks play instead.
 *
 * The tick schedule is derived from the wheel's own CSS easing curve: a tick plays
 * each time a segment boundary passes the pointer, so ticks are fast at the start and
 * slow to a crawl as the wheel settles, finishing when the wheel stops.
 *
 * Nothing here touches `window` at import time, so the pure timing helper is unit
 * testable under Node.
 */

/** The wheel's easing, shared by the CSS transition and the tick schedule. */
export const SPIN_EASING: readonly [number, number, number, number] = [0.17, 0.67, 0.12, 0.99];
export const SPIN_EASING_CSS = `cubic-bezier(${SPIN_EASING.join(", ")})`;

/** Samples a CSS cubic-bezier as (time fraction, progress fraction) pairs. */
function sampleBezier(
  [x1, y1, x2, y2]: readonly [number, number, number, number],
  steps: number,
): Array<[number, number]> {
  const b = (t: number, p1: number, p2: number) =>
    3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([b(t, x1, x2), b(t, y1, y2)]);
  }
  return out;
}

/**
 * Milliseconds (from spin start) at which a segment boundary passes the pointer.
 *
 * @param deltaDeg   how far the wheel turns in this spin
 * @param durationMs the spin's transition duration
 * @param segments   segments on the wheel
 * @param minGapMs   ticks closer than this are dropped — at full speed the boundaries
 *                   pass faster than a click can be heard as separate
 */
export function tickTimes(
  deltaDeg: number,
  durationMs: number,
  segments: number,
  minGapMs = 45,
): number[] {
  if (!(deltaDeg > 0) || !(durationMs > 0) || !(segments > 0)) return [];
  const segDeg = 360 / segments;
  const samples = sampleBezier(SPIN_EASING, 4000);
  const times: number[] = [];
  let next = segDeg;
  let last = -Infinity;
  for (let i = 1; i < samples.length && next <= deltaDeg; i++) {
    const [x0, y0] = samples[i - 1];
    const [x1, y1] = samples[i];
    while (next <= deltaDeg && y1 * deltaDeg >= next) {
      // Interpolate inside the sample for a precise crossing time.
      const a = y0 * deltaDeg, b = y1 * deltaDeg;
      const f = b === a ? 0 : (next - a) / (b - a);
      const ms = (x0 + (x1 - x0) * f) * durationMs;
      if (ms - last >= minGapMs) {
        times.push(Math.round(ms));
        last = ms;
      }
      next += segDeg;
    }
  }
  return times;
}

/** The spin music: 16s, covering the 15s spin and its fade-out. */
export const SPIN_MUSIC_URL = "/sounds/lucky-draw-spin.mp3";
/** Seconds to fade the music out once the wheel has stopped. */
const MUSIC_FADE_S = 0.35;

type AudioCtor = typeof AudioContext;

/**
 * One AudioContext per Draw mode session. Create it (via `ensure`) only inside a user
 * gesture — browsers keep a context started any other way suspended.
 */
export class DrawSound {
  private ctx: AudioContext | null = null;
  private tickBus: GainNode | null = null;
  private musicBytes: Promise<ArrayBuffer | null> | null = null;
  private music: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;

  /**
   * Starts downloading the spin music. Needs no user gesture (no AudioContext yet), so
   * call it when Draw mode opens: the clip is then ready by the first spin.
   */
  preloadMusic(): void {
    if (this.musicBytes || typeof fetch === "undefined") return;
    this.musicBytes = fetch(SPIN_MUSIC_URL)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    // Decode right away, before any click. Waiting for the Spin click (when the live
    // AudioContext may first be created) meant the very first spin always started
    // before the music was ready and fell back to ticks. An OfflineAudioContext needs
    // no user gesture, and the AudioBuffer it returns plays in any context.
    const Offline =
      typeof window !== "undefined"
        ? (window.OfflineAudioContext ??
          (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
            .webkitOfflineAudioContext)
        : undefined;
    if (!Offline) return;
    void this.musicBytes.then(async (bytes) => {
      if (!bytes || this.music) return;
      try {
        // A copy: decodeAudioData detaches the buffer it is given.
        this.music = await new Offline(2, 1, 44100).decodeAudioData(bytes.slice(0));
      } catch {
        /* decodeMusic retries with the live context on the first click */
      }
    });
  }

  /** Decodes the downloaded clip once a context exists. Failure just keeps the ticks. */
  private decodeMusic(): void {
    const ctx = this.ctx;
    if (!ctx || this.music) return;
    this.preloadMusic();
    void this.musicBytes?.then(async (bytes) => {
      if (!bytes || this.music || this.ctx !== ctx) return;
      try {
        // A copy: decodeAudioData detaches the buffer it is given.
        this.music = await ctx.decodeAudioData(bytes.slice(0));
      } catch {
        /* undecodable: the ticks remain */
      }
    });
  }

  /** Creates or resumes the context. Call from a click handler. Returns false if unsupported. */
  ensure(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return false;
      try {
        this.ctx = new Ctor();
      } catch {
        return false;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    this.decodeMusic();
    return true;
  }

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state !== "closed";
  }

  /**
   * Sound for one spin: the music clip, faded out as the wheel stops after
   * `durationMs`, or, if the clip isn't ready yet, the ticks in `tickTimesMs`.
   */
  playSpin(durationMs: number, tickTimesMs: number[]): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.stopSpin();
    if (!this.music) {
      this.playTicks(tickTimesMs);
      return;
    }
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = this.music;
    source.connect(gain);
    const t0 = ctx.currentTime + 0.02;
    const end = t0 + durationMs / 1000;
    gain.gain.setValueAtTime(0.8, t0);
    gain.gain.setValueAtTime(0.8, end);
    gain.gain.linearRampToValueAtTime(0.0001, end + MUSIC_FADE_S);
    source.start(t0);
    source.stop(end + MUSIC_FADE_S + 0.05);
    this.musicSource = source;
    this.musicGain = gain;
  }

  /** Schedules one short click per entry in `timesMs`, relative to now. */
  private playTicks(timesMs: number[]): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.gain.value = 0.35;
    bus.connect(ctx.destination);
    this.tickBus = bus;
    const t0 = ctx.currentTime + 0.02;
    const lastIdx = timesMs.length - 1;
    timesMs.forEach((ms, i) => {
      const at = t0 + ms / 1000;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      // Slight pitch drop towards the end, like a ratchet running out of momentum.
      osc.frequency.value = 1500 - (i / Math.max(1, lastIdx)) * 500;
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(0.5, at + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
      osc.connect(env).connect(bus);
      osc.start(at);
      osc.stop(at + 0.05);
    });
  }

  /** Silences the spin sound: a quick fade on the music, the pending ticks cut. */
  stopSpin(): void {
    const ctx = this.ctx;
    const source = this.musicSource;
    const gain = this.musicGain;
    this.musicSource = null;
    this.musicGain = null;
    if (ctx && source && gain) {
      try {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
        source.stop(now + 0.15);
      } catch {
        /* already stopped */
      }
    }
    if (this.tickBus) {
      try {
        this.tickBus.disconnect();
      } catch {
        /* already disconnected */
      }
      this.tickBus = null;
    }
  }

  /** A short rising C-major arpeggio with a held top note. */
  playFanfare(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const out = ctx.createGain();
    out.gain.value = 0.28;
    out.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.03;
    const notes: Array<[freq: number, start: number, len: number]> = [
      [523.25, 0, 0.14],
      [659.25, 0.12, 0.14],
      [783.99, 0.24, 0.14],
      [1046.5, 0.36, 0.7],
    ];
    for (const [freq, start, len] of notes) {
      for (const [type, mult, vol] of [["triangle", 1, 1], ["sine", 2, 0.3]] as const) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq * mult;
        const at = t0 + start;
        env.gain.setValueAtTime(0.0001, at);
        env.gain.exponentialRampToValueAtTime(vol, at + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, at + len);
        osc.connect(env).connect(out);
        osc.start(at);
        osc.stop(at + len + 0.05);
      }
    }
  }

  close(): void {
    this.stopSpin();
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx && ctx.state !== "closed") void ctx.close().catch(() => {});
  }
}
