"use client";

import { useEffect, useRef, useState } from "react";
import { motion, motionValue, animate, MotionValue } from "framer-motion";

const COLS     = 16;
const ROWS     = 14;
const GAP      = 20;
const PAD      = 32;
const TEXT_H   = 172;
const DOT_BASE = 1.2;
const DOT_MAX  = 18;
const RADIUS   = 100;
const STIFF    = 160;
const DAMP     = 16;

const DOT_W  = (COLS - 1) * GAP;
const DOT_H  = (ROWS - 1) * GAP;
const CARD_W = DOT_W + PAD * 2;
const CARD_H = DOT_H + PAD * 2 + TEXT_H;

// Center of dot grid in card-local CSS coordinates
const VCX = PAD + DOT_W / 2;
const VCY = PAD + DOT_H / 2;

const CARDS = [
  { title: "Study 01", label: "Effect.2 — 2024" },
  { title: "Study 02", label: "Effect.2 — 2024" },
  { title: "Study 03", label: "Effect.2 — 2024" },
  { title: "Study 04", label: "Effect.2 — 2024" },
  { title: "Study 05", label: "Effect.2 — 2024" },
];

// Stable per-card drag and mouse-position refs — never recreated
const cardX: MotionValue<number>[] = CARDS.map(() => motionValue(0));
type MousePos = { x: number; y: number } | null;
const cardMouse: { current: MousePos }[] = CARDS.map(() => ({ current: null }));

// ─── Shape functions ──────────────────────────────────────────────────────────
// Returns 0–1 for each dot position. dx/dy are offsets from grid center.

function shapeFrac(id: number, t: number, dx: number, dy: number): number {
  switch (id) {
    case 0: {
      // Rotating ellipse
      const rx  = RADIUS * (1 + 0.55 * Math.sin(t * 1.1));
      const ry  = RADIUS * (1 + 0.55 * Math.cos(t * 0.85));
      const ang = t * 0.36;
      const c = Math.cos(ang), s = Math.sin(ang);
      const distE = Math.sqrt(((dx * c + dy * s) / rx) ** 2 + ((-dx * s + dy * c) / ry) ** 2);
      return Math.max(0, 1 - distE);
    }
    case 1: {
      // Twin orbiting blobs
      const orbitR = 54;
      const blobR  = RADIUS * 0.68;
      const a1 = t * 0.75, a2 = a1 + Math.PI;
      const cx1 = orbitR * Math.cos(a1), cy1 = orbitR * Math.sin(a1 * 0.95);
      const cx2 = orbitR * Math.cos(a2), cy2 = orbitR * Math.sin(a2 * 0.95);
      const d1  = Math.sqrt((dx - cx1) ** 2 + (dy - cy1) ** 2) / blobR;
      const d2  = Math.sqrt((dx - cx2) ** 2 + (dy - cy2) ** 2) / blobR;
      return Math.max(0, Math.max(1 - d1, 1 - d2));
    }
    case 2: {
      // Breathing ring
      const ringR = RADIUS * (0.52 + 0.30 * Math.sin(t * 0.42));
      const r     = Math.sqrt(dx ** 2 + dy ** 2);
      const width = RADIUS * 0.30;
      return Math.max(0, 1 - Math.abs(r - ringR) / width);
    }
    case 3: {
      // Rotating wave band
      const ang = t * 0.28;
      const c = Math.cos(ang), s = Math.sin(ang);
      const projX =  dx * c + dy * s;
      const projY = -dx * s + dy * c;
      const A    = 44 + 18 * Math.sin(t * 0.38);
      const wave = A * Math.sin(projX / 60 + t * 0.95);
      const dist = Math.abs(projY - wave);
      const bw   = 28 + 10 * Math.cos(t * 0.32);
      const env  = Math.max(0, 1 - (projX / (RADIUS * 1.45)) ** 2);
      return Math.max(0, (1 - dist / bw) * Math.sqrt(env));
    }
    case 4: {
      // Radial pulse — concentric rings
      const r       = Math.sqrt(dx ** 2 + dy ** 2);
      const spacing = 48 + 10 * Math.sin(t * 0.28);
      const phase   = (r / spacing - t * 1.35) * Math.PI * 2;
      const ring    = (Math.cos(phase) + 1) / 2;
      const env     = Math.max(0, 1 - r / (RADIUS * 1.7));
      return Math.pow(ring, 2.0) * env;
    }
    default: return 0;
  }
}

// ─── Canvas component ─────────────────────────────────────────────────────────

type Dot = { x: number; y: number; r: number; vel: number };

function DotCanvas({ active, shapeId }: { active: boolean; shapeId: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let dpr      = window.devicePixelRatio || 1;

    const setSize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width  = (DOT_W + PAD * 2) * dpr;
      canvas.height = (DOT_H + PAD * 2) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const dots: Dot[] = [];
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++)
        dots.push({ x: PAD + col * GAP, y: PAD + row * GAP, r: DOT_BASE, vel: 0 });

    let last = performance.now();
    let raf: number;

    const loop = (now: number) => {
      const delta     = Math.min((now - last) / 1000, 0.05);
      const t         = now / 1000;
      last = now;

      const isActive  = activeRef.current;
      const intensity = isActive ? 1.0 : 0.45;
      const mouse     = cardMouse[shapeId].current;

      for (const dot of dots) {
        const dx = dot.x - VCX;
        const dy = dot.y - VCY;

        // Animated shape
        const sf = shapeFrac(shapeId, t, dx, dy) * intensity;

        // Mouse cursor falloff — only on the active card, blended additively
        let cf = 0;
        if (isActive && mouse) {
          const mdx  = dot.x - mouse.x;
          const mdy  = dot.y - mouse.y;
          const dist = Math.sqrt(mdx ** 2 + mdy ** 2);
          cf = Math.max(0, 1 - dist / RADIUS);
        }

        const frac   = Math.max(sf, cf);
        const target = DOT_BASE + (DOT_MAX - DOT_BASE) * frac * frac;
        const force  = (target - dot.r) * STIFF - dot.vel * DAMP;
        dot.vel += force * delta;
        dot.r   += dot.vel * delta;
        dot.r    = Math.max(0.5, dot.r);
      }

      ctx.fillStyle = "#F4EFE6";
      ctx.fillRect(0, 0, DOT_W + PAD * 2, DOT_H + PAD * 2);
      ctx.fillStyle = "#1A1714";
      for (const dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shapeId]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: CARD_W, height: DOT_H + PAD * 2 }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DotGridPage() {
  const [order, setOrder] = useState(() => CARDS.map((_, i) => i));

  const sendToBack = () => {
    const topId = order[0];
    animate(cardX[topId], 0, { type: "spring", stiffness: 200, damping: 26 });
    setOrder(prev => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const STACK_Y     = 16;
  const STACK_SCALE = 0.048;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#F4EFE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H + CARDS.length * STACK_Y + 20,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}>
        {[...order].reverse().map((cardId) => {
          const stackIdx = order.indexOf(cardId);
          const isTop    = stackIdx === 0;
          const card     = CARDS[cardId];
          const x        = cardX[cardId];

          return (
            <motion.div
              key={cardId}
              drag={isTop ? "x" : false}
              style={{
                x,
                position:        "absolute",
                width:           CARD_W,
                height:          CARD_H,
                borderRadius:    20,
                background:      "#F4EFE6",
                boxShadow:       "0 2px 6px rgba(20,20,40,0.28), 0 6px 14px rgba(20,20,40,0.16)",
                overflow:        "hidden",
                cursor:          isTop ? "grab" : "default",
                transformOrigin: "50% 50%",
              }}
              animate={{ y: stackIdx * STACK_Y, scale: 1 - stackIdx * STACK_SCALE }}
              transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.9 }}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              whileDrag={{ cursor: "grabbing" }}
              onMouseMove={isTop ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                // Store position in canvas-local coordinates (relative to canvas origin = card top-left)
                cardMouse[cardId].current = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                };
              } : undefined}
              onMouseLeave={isTop ? () => {
                cardMouse[cardId].current = null;
              } : undefined}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
                  sendToBack();
                } else {
                  animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
                }
              }}
            >
              <DotCanvas active={isTop} shapeId={cardId} />
              <div style={{ height: 1, background: "#D4CCBD" }} />
              <div style={{ padding: `28px ${PAD}px`, height: TEXT_H - 28, background: "#2A2520" }}>
                <div style={{ fontFamily: "-apple-system, sans-serif", fontSize: 13, fontWeight: 500, color: "#FAF6EE", marginBottom: 8 }}>
                  {card.title}
                </div>
                <div style={{ fontFamily: "var(--font-pp-supply-mono), monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(250,246,238,0.45)" }}>
                  {card.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{
        position: "fixed", bottom: 20, right: 24,
        fontFamily: "var(--font-pp-supply-mono), monospace",
        fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "#6B6359", lineHeight: 1.7, textAlign: "right", pointerEvents: "none",
      }}>
        Effect.2<br /><span style={{ opacity: 0.5 }}>Drag to Cycle</span>
      </div>
    </div>
  );
}
