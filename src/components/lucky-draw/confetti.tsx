"use client";

import { useEffect, useRef } from "react";

const COLOURS = ["#06B6D4", "#14B8A6", "#F97316", "#FB923C", "#FACC15", "#FFFFFF", "#22D3EE"];
const DURATION_MS = 3200;
const COUNT = 170;

interface Piece {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; vr: number; colour: string;
}

/**
 * A one-shot canvas confetti burst from both bottom corners. Mount it (with a new
 * `key`) to fire again. Callers skip it entirely under `prefers-reduced-motion`.
 */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = canvas.clientWidth, H = canvas.clientHeight;
    const scale = Math.max(0.6, Math.min(1.6, W / 1000));
    const pieces: Piece[] = Array.from({ length: COUNT }, (_, i) => {
      const left = i % 2 === 0;
      const angle = (left ? -60 : -120) + (Math.random() - 0.5) * 40;
      const speed = (11 + Math.random() * 9) * scale;
      const rad = (angle * Math.PI) / 180;
      return {
        x: left ? W * 0.05 : W * 0.95,
        y: H,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed * 1.4,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        colour: COLOURS[i % COLOURS.length],
      };
    });

    let raf = 0;
    const start = performance.now();
    let prev = start;
    const frame = (now: number) => {
      const dt = Math.min(2, (now - prev) / 16.67);
      prev = now;
      const elapsed = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = elapsed > DURATION_MS - 600 ? Math.max(0, (DURATION_MS - elapsed) / 600) : 1;
      for (const p of pieces) {
        p.vy += 0.32 * dt;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.colour;
        // Squash on one axis to fake a flutter.
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        ctx.restore();
      }
      if (elapsed < DURATION_MS) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}
