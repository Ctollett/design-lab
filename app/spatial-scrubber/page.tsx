"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// --- Stable waveform (generated once, never changes) ---
const BAR_COUNT = 78;
const BARS: number[] = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = i / BAR_COUNT;
  const a = Math.abs(Math.sin(t * Math.PI * 5.7 + 0.3)) * 0.55;
  const b = Math.abs(Math.sin(t * Math.PI * 12.4 + 1.1)) * 0.28;
  return Math.min(1, a + b + 0.07);
});

const TOTAL_SEC = 247; // 4:07
const WAVEFORM_H = 88;
const BAR_W = 4;
const BAR_GAP = 2;
const WAVEFORM_W = BAR_COUNT * (BAR_W + BAR_GAP);

// Dot grid constants — Nothing Phone / Braun LED matrix aesthetic
const DOT_R = 2;      // 4px diameter
const DOT_STRIDE = 7; // center-to-center vertical spacing
const DOT_ROWS = 11;  // odd so there's a true center row
const DOT_MID = 5;    // center row index (0-indexed)
const DOT_START_Y = WAVEFORM_H / 2 - DOT_MID * DOT_STRIDE; // = 9
const REEL_SIZE = 88;
const MAX_DRAG = 180; // px → ±4× rate

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${pad2(m)}:${pad2(s)}.${pad2(ms)}`;
}

// Tape reel — SVG with wound tape mass, spokes, hub
function Reel({
  size,
  fillRatio,
  rotation,
}: {
  size: number;
  fillRatio: number;
  rotation: number;
}) {
  const r = size / 2;
  const outerR = r - 3;
  const tapeR = outerR * (0.28 + fillRatio * 0.38);
  const hubR = outerR * 0.13;
  const SPOKES = 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {/* Outer rim */}
      <circle
        cx={r}
        cy={r}
        r={outerR}
        fill="none"
        stroke="#1E1E1E"
        strokeWidth={2.5}
      />
      {/* Tape mass (rotates) */}
      <g transform={`rotate(${rotation} ${r} ${r})`}>
        <circle cx={r} cy={r} r={tapeR} fill="#131313" stroke="#272727" strokeWidth={1.5} />
        <circle
          cx={r}
          cy={r}
          r={tapeR * 0.84}
          fill="none"
          stroke="#1E1E1E"
          strokeWidth={0.75}
          strokeDasharray="3.5 2.5"
        />
        {Array.from({ length: SPOKES }).map((_, i) => {
          const a = (i / SPOKES) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={r + Math.cos(a) * hubR}
              y1={r + Math.sin(a) * hubR}
              x2={r + Math.cos(a) * tapeR * 0.9}
              y2={r + Math.sin(a) * tapeR * 0.9}
              stroke="#222222"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* Hub */}
        <circle cx={r} cy={r} r={hubR} fill="#131313" stroke="#272727" strokeWidth={1} />
        <circle cx={r} cy={r} r={hubR * 0.45} fill="#272727" />
      </g>
    </svg>
  );
}

// Rate indicator bar — visual fill showing scrub rate magnitude + direction
function RateBar({ rate }: { rate: number }) {
  const pct = Math.abs(rate) / 4; // 0–1
  const isPos = rate >= 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 4 }}>
      {/* Left (reverse) fill — grows left from center */}
      <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "flex-end" }}>
        <motion.div
          style={{
            height: "100%",
            background: "#B54A2A",
            borderRadius: 2,
            opacity: 0.7,
          }}
          animate={{ width: isPos ? 0 : `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      </div>
      {/* Center dot */}
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2C2C2C", flexShrink: 0 }} />
      {/* Right (forward) fill */}
      <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "flex-start" }}>
        <motion.div
          style={{
            height: "100%",
            background: "#B54A2A",
            borderRadius: 2,
            opacity: 0.7,
          }}
          animate={{ width: isPos ? `${pct * 100}%` : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      </div>
    </div>
  );
}

export default function SpatialScrubber() {
  const [progress, setProgress] = useState(0.14);
  const [rate, setRate] = useState(0);
  const [dragging, setDragging] = useState(false);

  const isDragging = useRef(false);
  const grabX = useRef(0);
  const scrubRateRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // Motion values for liquid blob
  const rawDX = useMotionValue(0);
  const springDX = useSpring(rawDX, { stiffness: 220, damping: 18 });

  // Secondary blob offset — hard cap at 44px so it NEVER separates from main
  // (with stdDeviation=9 and combined radii ~29px, 44px is safely within connection range)
  const secOffsetX = useTransform(springDX, (dx) =>
    Math.sign(dx) * Math.min(44, Math.abs(dx) * 0.42)
  );

  const startLoop = useCallback(() => {
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      if (!isDragging.current) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      setProgress((p) => Math.max(0, Math.min(1, p + scrubRateRef.current * dt)));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDragging.current = true;
      setDragging(true);
      grabX.current = e.clientX;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      startLoop();
    },
    [startLoop]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const dx = e.clientX - grabX.current;
      rawDX.set(dx);
      const clampedDX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx));
      const rateVal = (clampedDX / MAX_DRAG) * 4;
      // 0.5 = half the track per second at max drag — very noticeable
      scrubRateRef.current = (clampedDX / MAX_DRAG) * 0.5;
      setRate(rateVal);
    },
    [rawDX]
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    rawDX.set(0);
    scrubRateRef.current = 0;
    setRate(0);
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, [rawDX]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const currentTime = progress * TOTAL_SEC;
  const playheadX = progress * WAVEFORM_W;

  // Tape reel fill ratios
  const leftFill = 0.12 + progress * 0.72;
  const rightFill = 0.84 - progress * 0.72;

  // Reel rotation (degrees, proportional to progress)
  const reelAngle = progress * 900;

  const MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace";
  const SERIF = "'Fraunces', Georgia, serif";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        userSelect: "none",
        cursor: dragging ? "grabbing" : "default",
        position: "relative",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* SVG filter defs — gooey liquid effect */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <filter id="liquid-goo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      {/* Series label — top right corner */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 28,
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#2C2C2C",
          lineHeight: 1.7,
          textAlign: "right",
        }}
      >
        AUDIO.3<br />SPATIAL SCRUBBER
      </div>

      {/* Track title */}
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 20,
          color: "#A89880",
          letterSpacing: "-0.02em",
          marginBottom: 48,
          marginTop: 0,
        }}
      >
        Void Sessions — Track 07
      </p>

      {/* Tape + Waveform row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
        onPointerDown={onPointerDown}
      >
        {/* Left reel (played tape — grows) */}
        <div style={{ opacity: 0.9 }}>
          <Reel size={REEL_SIZE} fillRatio={leftFill} rotation={reelAngle} />
        </div>

        {/* Waveform card */}
        <div
          style={{
            position: "relative",
            background: "#131313",
            border: "1px solid #1E1E1E",
            borderRadius: 16,
            padding: "18px 20px 14px",
            cursor: dragging ? "grabbing" : "grab",
          }}
        >
          {/* Track label */}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 8.5,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#2C2C2C",
              marginBottom: 14,
            }}
          >
            NEW SESSION #032
          </div>

          {/* Waveform + blob handle */}
          <div
            style={{
              position: "relative",
              width: WAVEFORM_W,
              height: WAVEFORM_H,
            }}
          >
            {/* SVG dot-matrix waveform */}
            <svg
              width={WAVEFORM_W}
              height={WAVEFORM_H}
              style={{ display: "block" }}
            >
              <defs>
                <clipPath id="wf-past">
                  <rect x={0} y={0} width={playheadX} height={WAVEFORM_H} />
                </clipPath>
              </defs>

              {/* Ghost layer — full waveform, dim */}
              {BARS.flatMap((h, col) => {
                const cx = col * (BAR_W + BAR_GAP) + BAR_W / 2;
                const litCount = Math.round(h * (DOT_MID + 0.5));
                return Array.from({ length: DOT_ROWS }, (_, row) => {
                  const cy = DOT_START_Y + row * DOT_STRIDE;
                  const isLit = Math.abs(row - DOT_MID) < litCount;
                  return (
                    <circle
                      key={`g${col}-${row}`}
                      cx={cx}
                      cy={cy}
                      r={DOT_R}
                      fill="#C8BEA8"
                      opacity={isLit ? 0.16 : 0.04}
                    />
                  );
                });
              })}

              {/* Active layer — bright, clipped to played region */}
              <g clipPath="url(#wf-past)">
                {BARS.flatMap((h, col) => {
                  const cx = col * (BAR_W + BAR_GAP) + BAR_W / 2;
                  const litCount = Math.round(h * (DOT_MID + 0.5));
                  return Array.from({ length: DOT_ROWS }, (_, row) => {
                    const cy = DOT_START_Y + row * DOT_STRIDE;
                    const isLit = Math.abs(row - DOT_MID) < litCount;
                    return (
                      <circle
                        key={`a${col}-${row}`}
                        cx={cx}
                        cy={cy}
                        r={DOT_R}
                        fill="#C8BEA8"
                        opacity={isLit ? 0.84 : 0.07}
                      />
                    );
                  });
                })}
              </g>

              {/* Playhead — red dot column */}
              <line
                x1={playheadX}
                y1={DOT_START_Y - DOT_R}
                x2={playheadX}
                y2={DOT_START_Y + (DOT_ROWS - 1) * DOT_STRIDE + DOT_R}
                stroke="#B54A2A"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.9}
              />
            </svg>

            {/* Liquid blob handle — gooey two-blob pull effect */}
            <div
              style={{
                position: "absolute",
                // Container: main (32px) + max offset (44px) + blur headroom (18px each side)
                width: 160,
                height: 64,
                left: playheadX - 80,
                top: "50%",
                transform: "translateY(-50%)",
                filter: "url(#liquid-goo)",
                pointerEvents: "none",
              }}
            >
              {/* Main blob — 32px, anchored at container center (playhead) */}
              <div
                style={{
                  position: "absolute",
                  left: 80 - 16,
                  top: 32 - 16,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#B54A2A",
                }}
              />
              {/* Secondary blob — 22px, always stays within gooey range */}
              <motion.div
                style={{
                  position: "absolute",
                  left: 80,
                  top: 32,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#B54A2A",
                  translateX: "-50%",
                  translateY: "-50%",
                  x: secOffsetX,
                }}
              />
            </div>
          </div>

          {/* Rate direction bar */}
          <div style={{ marginTop: 10, marginBottom: 10, paddingLeft: 2, paddingRight: 2 }}>
            <RateBar rate={rate} />
          </div>

          {/* Time and rate readouts */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.08em",
              fontVariantNumeric: "tabular-nums",
              color: "#383838",
            }}
          >
            <span style={{ color: "#565656" }}>{fmtTime(currentTime)}</span>
            <span
              style={{
                color: Math.abs(rate) > 0.05 ? "#B54A2A" : "#2C2C2C",
                transition: "color 0.15s",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              RATE:{" "}
              {rate >= 0 ? "+" : ""}
              {rate.toFixed(1)}×
            </span>
            <span style={{ color: "#2C2C2C" }}>{fmtTime(TOTAL_SEC)}</span>
          </div>
        </div>

        {/* Right reel (remaining tape — shrinks) */}
        <div style={{ opacity: 0.9 }}>
          <Reel size={REEL_SIZE} fillRatio={rightFill} rotation={-reelAngle} />
        </div>
      </div>

      {/* Interaction hint */}
      <p
        style={{
          fontFamily: MONO,
          fontSize: 8.5,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#1E1E1E",
          marginTop: 52,
          marginBottom: 0,
        }}
      >
        DRAG — DISTANCE SETS RATE
      </p>
    </div>
  );
}
