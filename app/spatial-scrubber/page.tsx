"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const LINE_W = 1;
const LINE_GAP = 1;
const LINE_COUNT = 234;
const BARS: number[] = Array.from({ length: LINE_COUNT }, (_, i) => {
  const t = i / LINE_COUNT;
  const env = 0.25 + 0.75 * Math.pow(Math.sin(t * Math.PI), 0.6);
  const a = Math.abs(Math.sin(t * Math.PI * 38.3 + 0.7)) * 0.45;
  const b = Math.abs(Math.sin(t * Math.PI * 17.1 + 2.3)) * 0.32;
  const c = Math.abs(Math.sin(t * Math.PI * 7.2 + 1.1)) * 0.23;
  return Math.min(1, env * (a + b + c) + 0.04);
});

const TOTAL_SEC = 247;
const WAVEFORM_H = 88;
const BAR_W = LINE_W;
const BAR_GAP = LINE_GAP;
const WAVEFORM_W = LINE_COUNT * (LINE_W + LINE_GAP); // 468px

const REEL_SIZE = 128;
const WF_CENTER_Y = WAVEFORM_H / 2;
const WF_MAX_AMP = WAVEFORM_H / 2 - 6;
const MAX_DRAG = 180;

// Blob geometry
const BLOB_W = 190;
const BLOB_H = 96;
const BLOB_CX = BLOB_W / 2; // 95
const BLOB_CY = BLOB_H / 2; // 48
const MAIN_D = 52;
const SEC_D = 30;
const BRIDGE_H = 14;
const MAX_OFFSET = 50;

// Reel row slightly wider than card so reels extend naturally
const REEL_ROW_W = WAVEFORM_W + 80; // 548px

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${pad2(m)}:${pad2(s)}.${pad2(ms)}`;
}

function RewindIcon({ active }: { active: boolean }) {
  const c = active ? "#6B7A5A" : "#404A3C";
  return (
    <svg
      width={16} height={12} viewBox="0 0 16 12" fill="none"
      style={{ opacity: active ? 1 : 0.35, transition: "opacity 0.2s ease" }}
    >
      <polyline points="15,1 9,6 15,11" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="8,1 2,6 8,11" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FastForwardIcon({ active }: { active: boolean }) {
  const c = active ? "#6B7A5A" : "#404A3C";
  return (
    <svg
      width={16} height={12} viewBox="0 0 16 12" fill="none"
      style={{ opacity: active ? 1 : 0.35, transition: "opacity 0.2s ease" }}
    >
      <polyline points="1,1 7,6 1,11" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="8,1 14,6 8,11" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Reel({
  size,
  fillRatio,
  rotation,
  tapeColor = "#2A3028",
}: {
  size: number;
  fillRatio: number;
  rotation: number;
  tapeColor?: string;
}) {
  const r = size / 2;
  const outerR = r - 4;
  const hubR = outerR * 0.11;
  const innerTapeR = outerR * 0.24;
  const outerTapeR = outerR * (0.28 + fillRatio * 0.38);
  const SPOKES = 3;
  const RING_SPACING = 4;
  const ringCount = Math.max(2, Math.round((outerTapeR - innerTapeR) / RING_SPACING) + 1);
  const rings = Array.from({ length: ringCount }, (_, i) =>
    innerTapeR + (i / Math.max(1, ringCount - 1)) * (outerTapeR - innerTapeR)
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={r} cy={r} r={outerR} fill="none" strokeWidth={2}
        style={{ stroke: tapeColor, transition: "stroke 0.25s ease" }} />
      <g transform={`rotate(${rotation} ${r} ${r})`}>
        {rings.map((radius, i) => (
          <circle key={i} cx={r} cy={r} r={radius} fill="none" stroke="#2A3028"
            strokeWidth={i === ringCount - 1 ? 1.5 : 0.75}
            style={{ opacity: 0.4 + (i / ringCount) * 0.6 }} />
        ))}
        {Array.from({ length: SPOKES }).map((_, i) => {
          const a = (i / SPOKES) * Math.PI * 2;
          return (
            <line key={i}
              x1={r + Math.cos(a) * (hubR + 1)} y1={r + Math.sin(a) * (hubR + 1)}
              x2={r + Math.cos(a) * (innerTapeR - 2)} y2={r + Math.sin(a) * (innerTapeR - 2)}
              stroke="#2A3028" strokeWidth={1} strokeLinecap="round" />
          );
        })}
        <circle cx={r} cy={r} r={hubR} fill="none" stroke="#2A3028" strokeWidth={1.5} />
        <circle cx={r} cy={r} r={2.5} fill="#2A3028" />
      </g>
    </svg>
  );
}

function RateBar({ rate }: { rate: number }) {
  const pct = Math.abs(rate) / 4;
  const isPos = rate >= 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 4 }}>
      <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "flex-end" }}>
        <motion.div
          style={{ height: "100%", background: "#6B7A5A", borderRadius: 2, opacity: 0.7 }}
          animate={{ width: isPos ? 0 : `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      </div>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#404A3C", flexShrink: 0 }} />
      <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "flex-start" }}>
        <motion.div
          style={{ height: "100%", background: "#6B7A5A", borderRadius: 2, opacity: 0.7 }}
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

  const rawDX = useMotionValue(0);
  const springDX = useSpring(rawDX, { stiffness: 180, damping: 9 });

  const secOffsetX = useTransform(springDX, (dx) =>
    Math.sign(dx) * Math.min(MAX_OFFSET, Math.abs(dx) * 0.40)
  );

  // Bridge connecting main blob to secondary — keeps goo fill at max stretch
  const bridgeLeft = useTransform(secOffsetX, (x) => (x < 0 ? BLOB_CX + x : BLOB_CX));
  const bridgeWidth = useTransform(secOffsetX, (x) => Math.max(0, Math.abs(x)));

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
      scrubRateRef.current = (clampedDX / MAX_DRAG) * 1.2;
      setRate((clampedDX / MAX_DRAG) * 4);
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
  const leftFill = 0.12 + progress * 0.72;
  const rightFill = 0.84 - progress * 0.72;
  const reelAngle = progress * 900;

  const MONO = "var(--font-mdui), monospace";
  const SUPPLY = "var(--font-pp-supply-mono), monospace";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#E3E8DC",
        userSelect: "none",
        cursor: dragging ? "grabbing" : "default",
        position: "relative",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Goo SVG filter */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <filter id="liquid-goo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      {/* Series label */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 28,
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#485A3E",
          lineHeight: 1.7,
          textAlign: "right",
        }}
      >
        AUDIO.3<br />SPATIAL SCRUBBER
      </div>

      {/* Track title */}
      <p
        style={{
          fontFamily: MONO,
          fontWeight: 400,
          fontSize: 13,
          color: "#2A3824",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 48,
          marginTop: 0,
        }}
      >
        Void Sessions — Track 07
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Waveform card */}
        <div
          style={{
            position: "relative",
            background: "#141812",
            border: "1px solid #1E231C",
            borderRadius: 16,
            padding: "18px 20px 14px",
            cursor: dragging ? "grabbing" : "grab",
          }}
        >
          <div
            style={{
              fontFamily: SUPPLY,
              fontSize: 8.5,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "#4A5848",
              marginBottom: 14,
            }}
          >
            NEW SESSION #032
          </div>

          <div style={{ position: "relative", width: WAVEFORM_W, height: WAVEFORM_H }}>
            <svg width={WAVEFORM_W} height={WAVEFORM_H} style={{ display: "block" }}>
              <defs>
                <clipPath id="wf-past">
                  <rect x={0} y={0} width={playheadX} height={WAVEFORM_H} />
                </clipPath>
              </defs>
              {BARS.map((h, i) => {
                const x = i * (BAR_W + BAR_GAP);
                const bh = Math.max(1, h * WF_MAX_AMP * 2);
                return (
                  <rect key={i} x={x} y={WF_CENTER_Y - bh / 2} width={BAR_W} height={bh}
                    fill="#7A9470" opacity={0.18} />
                );
              })}
              <g clipPath="url(#wf-past)">
                {BARS.map((h, i) => {
                  const x = i * (BAR_W + BAR_GAP);
                  const bh = Math.max(1, h * WF_MAX_AMP * 2);
                  return (
                    <rect key={i} x={x} y={WF_CENTER_Y - bh / 2} width={BAR_W} height={bh}
                      fill="#7A9470" opacity={0.82} />
                  );
                })}
              </g>
              <line
                x1={playheadX} y1={4} x2={playheadX} y2={WAVEFORM_H - 4}
                stroke="#6B7A5A" strokeWidth={1.5} strokeLinecap="round" opacity={0.9}
              />
            </svg>
          </div>

          <div style={{ marginTop: 10, marginBottom: 10, paddingLeft: 2, paddingRight: 2 }}>
            <RateBar rate={rate} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: SUPPLY,
              fontSize: 10,
              letterSpacing: "0.08em",
              fontVariantNumeric: "tabular-nums",
              color: "#525C4E",
            }}
          >
            <span style={{ color: "#68756A" }}>{fmtTime(currentTime)}</span>
            <span
              style={{
                color: Math.abs(rate) > 0.05 ? "#6B7A5A" : "#4A5848",
                transition: "color 0.15s",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              RATE: {rate >= 0 ? "+" : ""}{rate.toFixed(1)}×
            </span>
            <span style={{ color: "#4A5848" }}>{fmtTime(TOTAL_SEC)}</span>
          </div>
        </div>

        {/* Reels + scrubber row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: REEL_ROW_W,
            paddingTop: 8,
          }}
        >
          <Reel
            size={REEL_SIZE} fillRatio={leftFill} rotation={reelAngle}
            tapeColor={rate < -0.05 ? "#6B7A5A" : "#2A3028"}
          />

          {/* Center scrubber */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: dragging ? "grabbing" : "grab",
            }}
            onPointerDown={onPointerDown}
          >
            {/* Rail + blob row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RewindIcon active={rate < -0.1} />

              {/* Wrapper — track and blob share the same coordinate space */}
              <div style={{ position: "relative", width: BLOB_W, height: BLOB_H, flexShrink: 0 }}>
                {/* Track line spanning the full travel zone */}
                <div
                  style={{
                    position: "absolute",
                    left: BLOB_CX - MAX_OFFSET,
                    top: BLOB_CY - 0.5,
                    width: MAX_OFFSET * 2,
                    height: 1,
                    background: "#404A3C",
                    opacity: 0.15,
                    pointerEvents: "none",
                  }}
                />
                {/* Left end stop */}
                <div
                  style={{
                    position: "absolute",
                    left: BLOB_CX - MAX_OFFSET,
                    top: BLOB_CY - 6,
                    width: 1,
                    height: 12,
                    background: "#404A3C",
                    opacity: 0.28,
                    pointerEvents: "none",
                  }}
                />
                {/* Right end stop */}
                <div
                  style={{
                    position: "absolute",
                    left: BLOB_CX + MAX_OFFSET,
                    top: BLOB_CY - 6,
                    width: 1,
                    height: 12,
                    background: "#404A3C",
                    opacity: 0.28,
                    pointerEvents: "none",
                  }}
                />

                {/* Goo blob — layered on top of track */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    filter: "url(#liquid-goo)",
                    transform: "translateZ(0)",
                  }}
                >
                  {/* Main blob */}
                  <div
                    style={{
                      position: "absolute",
                      left: BLOB_CX - MAIN_D / 2,
                      top: BLOB_CY - MAIN_D / 2,
                      width: MAIN_D,
                      height: MAIN_D,
                      borderRadius: "50%",
                      background: "#6B7A5A",
                    }}
                  />

                  {/* Bridge pill — maintains goo connection at full stretch */}
                  <motion.div
                    style={{
                      position: "absolute",
                      left: bridgeLeft,
                      top: BLOB_CY - BRIDGE_H / 2,
                      width: bridgeWidth,
                      height: BRIDGE_H,
                      borderRadius: BRIDGE_H / 2,
                      background: "#6B7A5A",
                    }}
                  />

                  {/* Secondary blob */}
                  <motion.div
                    style={{
                      position: "absolute",
                      left: BLOB_CX,
                      top: BLOB_CY,
                      width: SEC_D,
                      height: SEC_D,
                      borderRadius: "50%",
                      background: "#6B7A5A",
                      translateX: "-50%",
                      translateY: "-50%",
                      x: secOffsetX,
                    }}
                  />
                </div>
              </div>

              <FastForwardIcon active={rate > 0.1} />
            </div>

            <p
              style={{
                fontFamily: MONO,
                fontSize: 8,
                letterSpacing: "0.20em",
                textTransform: "uppercase",
                color: "#A8BAA0",
                margin: 0,
              }}
            >
              DRAG — DISTANCE SETS RATE
            </p>
          </div>

          <Reel
            size={REEL_SIZE} fillRatio={rightFill} rotation={-reelAngle}
            tapeColor={rate > 0.05 ? "#6B7A5A" : "#2A3028"}
          />
        </div>
      </div>
    </div>
  );
}
