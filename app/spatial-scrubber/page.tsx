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
const BLOB_RIM = 3;

// Reel row matches card outer width (WAVEFORM_W + 20px padding × 2)
const REEL_ROW_W = WAVEFORM_W + 40; // 508px
const TOTAL_SEC = 247;

function pad2(n: number) { return String(Math.floor(n)).padStart(2, "0"); }
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${pad2(m)}:${pad2(s)}`;
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
  tapeColor = "#1A1A1A",
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
  const T = "stroke 0.3s ease, fill 0.3s ease";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={r} cy={r} r={outerR} fill="none" strokeWidth={2}
        style={{ stroke: tapeColor, transition: T }} />
      <g transform={`rotate(${rotation} ${r} ${r})`}>
        {rings.map((radius, i) => (
          <circle key={i} cx={r} cy={r} r={radius} fill="none"
            strokeWidth={i === ringCount - 1 ? 1.5 : 0.75}
            style={{ stroke: tapeColor, transition: T }} />
        ))}
        {Array.from({ length: SPOKES }).map((_, i) => {
          const a = (i / SPOKES) * Math.PI * 2;
          return (
            <line key={i}
              x1={r + Math.cos(a) * (hubR + 1)} y1={r + Math.sin(a) * (hubR + 1)}
              x2={r + Math.cos(a) * (innerTapeR - 2)} y2={r + Math.sin(a) * (innerTapeR - 2)}
              strokeWidth={1} strokeLinecap="round"
              style={{ stroke: tapeColor, transition: T }} />
          );
        })}
        <circle cx={r} cy={r} r={hubR} fill="none" strokeWidth={1.5}
          style={{ stroke: tapeColor, transition: T }} />
        <circle cx={r} cy={r} r={2.5}
          style={{ fill: tapeColor, transition: T }} />
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

// ---- Tape audio ----
// Pre-renders a synthesized ambient loop, then drives two looping
// BufferSourceNodes (forward + reversed) via playbackRate for authentic
// pitch-shifts-with-speed tape character. No library needed.
function useTapeAudio() {
  const actx    = useRef<AudioContext | null>(null);
  const master   = useRef<GainNode | null>(null);
  const fwdGain  = useRef<GainNode | null>(null);
  const revGain  = useRef<GainNode | null>(null);
  const fwdSrc   = useRef<AudioBufferSourceNode | null>(null);
  const revSrc   = useRef<AudioBufferSourceNode | null>(null);
  const hissGain = useRef<GainNode | null>(null);
  const hissHPF  = useRef<BiquadFilterNode | null>(null);
  const fwdBuf   = useRef<AudioBuffer | null>(null);
  const dir      = useRef<"fwd" | "rev">("fwd");
  const live     = useRef(false);

  // Synthesise the recording offline — no user gesture required
  useEffect(() => {
    const SR  = 44100;
    const DUR = 12;
    const oCtx = new OfflineAudioContext(1, SR * DUR, SR);

    // Tape warmth chain: low-mid boost → lowpass rolloff → output
    const warmPeak = oCtx.createBiquadFilter();
    warmPeak.type = "peaking";
    warmPeak.frequency.value = 280;
    warmPeak.gain.value = 6;
    warmPeak.Q.value = 0.85;

    const lpf = oCtx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 900;
    lpf.Q.value = 0.5;

    warmPeak.connect(lpf);
    lpf.connect(oCtx.destination);

    const note = (
      freq: number, type: OscillatorType,
      t0: number, t1: number, vol: number
    ) => {
      const osc = oCtx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = oCtx.createGain();
      const mid = (t0 + t1) / 2;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, Math.min(t0 + 0.09, mid));
      g.gain.setValueAtTime(vol, Math.max(t1 - 0.07, mid));
      g.gain.linearRampToValueAtTime(0, t1);
      osc.connect(g);
      g.connect(warmPeak);
      osc.start(t0);
      osc.stop(t1);
    };

    // Chord pad — one octave lower, triangle for warm odd harmonics
    ([[55, 0.07], [65.41, 0.055], [82.41, 0.05], [110, 0.04]] as [number, number][])
      .forEach(([f, v]) => note(f, "triangle", 0, DUR, v));

    // Melody — dropped an octave into A2–C4 range
    const scale = [110, 130.81, 146.83, 164.81, 196.0, 220, 261.63];
    const pat   = [0, 2, 4, 6, 5, 3, 4, 2, 0, 1, 3, 5, 4, 2, 1, 0];
    const nl    = DUR / pat.length;
    pat.forEach((si, i) => note(scale[si], "triangle", i * nl, (i + 0.65) * nl, 0.09));

    // Deep bass pulses (A1)
    [0, 3, 6, 9].forEach((t) => note(55, "sine", t, t + 2.4, 0.08));

    oCtx.startRendering().then((buf) => { fwdBuf.current = buf; });
  }, []);

  const init = useCallback(async () => {
    if (live.current) {
      if (actx.current?.state === "suspended") await actx.current.resume();
      return;
    }
    if (!fwdBuf.current) return;
    live.current = true;

    const ctx = new AudioContext();
    actx.current = ctx;

    // Reverse buffer for rewind direction
    const fb  = fwdBuf.current;
    const rb  = ctx.createBuffer(1, fb.length, fb.sampleRate);
    const fd  = fb.getChannelData(0);
    const rd  = rb.getChannelData(0);
    for (let i = 0; i < fd.length; i++) rd[i] = fd[fd.length - 1 - i];

    // Graph: fwdSrc → fwdGain ─┐
    //        revSrc → revGain ─┴─ master → destination
    const mg = ctx.createGain();
    mg.gain.value = 0;
    mg.connect(ctx.destination);
    master.current = mg;

    const fg = ctx.createGain(); fg.gain.value = 1; fg.connect(mg);
    const rg = ctx.createGain(); rg.gain.value = 0; rg.connect(mg);
    fwdGain.current = fg;
    revGain.current = rg;

    const mkSrc = (buf: AudioBuffer, g: GainNode) => {
      const s = ctx.createBufferSource();
      s.buffer   = buf;
      s.loop     = true;
      s.playbackRate.value = 0.01;
      s.connect(g);
      s.start();
      return s;
    };
    fwdSrc.current = mkSrc(fb, fg);
    revSrc.current = mkSrc(rb, rg);

    // Tape hiss: highpass-filtered white noise
    const noiseLen = ctx.sampleRate * 2;
    const nBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd   = nBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = nBuf;
    ns.loop   = true;

    const hf = ctx.createBiquadFilter();
    hf.type = "highpass";
    hf.frequency.value = 4000;
    hissHPF.current = hf;

    const hg = ctx.createGain();
    hg.gain.value = 0;
    hissGain.current = hg;

    ns.connect(hf);
    hf.connect(hg);
    hg.connect(ctx.destination);
    ns.start();
  }, []);

  const tapeStart = useCallback(async () => {
    await init();
    const ctx = actx.current;
    const mg  = master.current;
    if (!ctx || !mg) return;
    mg.gain.cancelScheduledValues(ctx.currentTime);
    mg.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.06);
  }, [init]);

  const tapeUpdate = useCallback((rate: number) => {
    const ctx = actx.current;
    const fg  = fwdGain.current;
    const rg  = revGain.current;
    const fs  = fwdSrc.current;
    const rs  = revSrc.current;
    const hg  = hissGain.current;
    const hf  = hissHPF.current;
    if (!ctx || !fg || !rg || !fs || !rs) return;

    const now     = ctx.currentTime;
    const absRate = Math.abs(rate);
    const newDir  = rate < 0 ? "rev" : "fwd";

    // Crossfade on direction change
    if (newDir !== dir.current) {
      dir.current = newDir;
      if (newDir === "rev") {
        fg.gain.cancelScheduledValues(now); fg.gain.linearRampToValueAtTime(0, now + 0.04);
        rg.gain.cancelScheduledValues(now); rg.gain.linearRampToValueAtTime(1, now + 0.04);
      } else {
        rg.gain.cancelScheduledValues(now); rg.gain.linearRampToValueAtTime(0, now + 0.04);
        fg.gain.cancelScheduledValues(now); fg.gain.linearRampToValueAtTime(1, now + 0.04);
      }
    }

    const pr = Math.max(0.01, absRate);
    fs.playbackRate.value = newDir === "fwd" ? pr : 0.01;
    rs.playbackRate.value = newDir === "rev" ? pr : 0.01;

    // Hiss volume + cutoff scale with speed
    if (hg) hg.gain.value = Math.min(0.05, absRate * 0.012 + 0.003);
    if (hf) hf.frequency.value = 1800 + absRate * 2000;
  }, []);

  const tapeStop = useCallback(() => {
    const ctx = actx.current;
    const mg  = master.current;
    const hg  = hissGain.current;
    if (!ctx || !mg) return;
    const now = ctx.currentTime;
    mg.gain.cancelScheduledValues(now);
    mg.gain.linearRampToValueAtTime(0, now + 0.12);
    if (hg) { hg.gain.cancelScheduledValues(now); hg.gain.linearRampToValueAtTime(0, now + 0.12); }
    if (fwdSrc.current) fwdSrc.current.playbackRate.value = 0.01;
    if (revSrc.current) revSrc.current.playbackRate.value = 0.01;
  }, []);

  useEffect(() => { return () => { actx.current?.close().catch(() => {}); }; }, []);

  return { tapeStart, tapeUpdate, tapeStop };
}

export default function SpatialScrubber() {
  const [progress, setProgress] = useState(0.14);
  const [rate, setRate] = useState(0);
  const [dragging, setDragging] = useState(false);
  const atLimitRef = useRef(false);

  const isDragging = useRef(false);
  const grabX = useRef(0);
  const scrubRateRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const grainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = grainRef.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.createImageData(256, 256);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(Math.random() * 256);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    el.style.backgroundImage = `url(${canvas.toDataURL()})`;
  }, []);

  const { tapeStart, tapeUpdate, tapeStop } = useTapeAudio();

  const rawDX = useMotionValue(0);
  const springDX = useSpring(rawDX, { stiffness: 180, damping: 9 });

  const secOffsetX = useTransform(springDX, (dx) =>
    Math.sign(dx) * Math.min(MAX_OFFSET, Math.abs(dx) * 0.40)
  );

  // Impact bounce: fires when secondary blob first hits either end stop
  const impactOffset = useMotionValue(0);
  const impactSpring = useSpring(impactOffset, { stiffness: 520, damping: 13 });

  useEffect(() => {
    return secOffsetX.on("change", (x) => {
      const atLimit = Math.abs(x) >= MAX_OFFSET - 1.5;
      if (atLimit && !atLimitRef.current) {
        // Kick inward then let spring rebound
        impactOffset.set(-Math.sign(x) * 9);
        requestAnimationFrame(() => impactOffset.set(0));
      }
      atLimitRef.current = atLimit;
    });
  }, [secOffsetX, impactOffset]);

  // Final secondary blob position = clamped travel + impact bounce
  const secFinalX = useTransform(
    [secOffsetX, impactSpring] as const,
    ([offset, impact]: number[]) => offset + impact
  );

  // Bridge follows secFinalX so goo fill bounces too
  const bridgeLeft = useTransform(secFinalX, (x) => (x < 0 ? BLOB_CX + x : BLOB_CX));
  const bridgeWidth = useTransform(secFinalX, (x) => Math.max(0, Math.abs(x)));

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
      // Cancel any in-progress coast before starting a new drag
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      isDragging.current = true;
      setDragging(true);
      grabX.current = e.clientX;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      startLoop();
      tapeStart();
    },
    [startLoop, tapeStart]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const dx = e.clientX - grabX.current;
      rawDX.set(dx);
      const clampedDX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx));
      scrubRateRef.current = (clampedDX / MAX_DRAG) * 1.2;
      const rateVal = (clampedDX / MAX_DRAG) * 4;
      setRate(rateVal);
      tapeUpdate(rateVal);
    },
    [rawDX, tapeUpdate]
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    rawDX.set(0);
    setRate(0);
    tapeStop();

    // Capture velocity then hand off to a coast loop
    const coastV = { v: scrubRateRef.current };
    scrubRateRef.current = 0;

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    let lastT = performance.now();
    const coast = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      coastV.v *= Math.exp(-10 * dt); // decays to ~1% in ~460ms
      setProgress((p) => Math.max(0, Math.min(1, p + coastV.v * dt)));
      if (Math.abs(coastV.v) > 0.003) {
        animRef.current = requestAnimationFrame(coast);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(coast);
  }, [rawDX, tapeStop]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const playheadX = progress * WAVEFORM_W;
  const leftFill = 0.12 + progress * 0.72;
  const rightFill = 0.84 - progress * 0.72;
  const reelAngle = progress * 900;
  const currentTime = progress * TOTAL_SEC;

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
        background: "#EDF1E8",
        userSelect: "none",
        cursor: dragging ? "grabbing" : "default",
        position: "relative",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Analog grain overlay */}
      <div
        ref={grainRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 100,
          opacity: 0.05,
          mixBlendMode: "overlay",
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

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
          fontSize: 10,
          fontStyle: "normal",
          color: "#1C1A18",
          letterSpacing: "0.18em",
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
            boxShadow: [
              "0 2px 6px rgba(0,0,0,0.08)",
              "0 8px 20px rgba(0,0,0,0.14)",
              "inset 0 1px 0 rgba(255,255,255,0.40)",
              "inset 0 -2px 0 rgba(0,0,0,0.70)",
              "inset 1px 0 0 rgba(255,255,255,0.22)",
              "inset -1px 0 0 rgba(0,0,0,0.50)",
              "inset 0 0 40px rgba(80,130,60,0.05)",
            ].join(", "),
            cursor: dragging ? "grabbing" : "grab",
          }}
        >
          {/* Glass screen sheen — light catching the top-left of the panel */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 15,
              background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 30%, transparent 58%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />

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
                const bh = Math.round(Math.max(1, h * WF_MAX_AMP * 2) * 100) / 100;
                return (
                  <rect key={i} x={x} y={WF_CENTER_Y - bh / 2} width={BAR_W} height={bh}
                    fill="#7A9470" opacity={0.18} />
                );
              })}
              <g clipPath="url(#wf-past)">
                {BARS.map((h, i) => {
                  const x = i * (BAR_W + BAR_GAP);
                  const bh = Math.round(Math.max(1, h * WF_MAX_AMP * 2) * 100) / 100;
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

          <div style={{ marginTop: 10, marginBottom: 6, paddingLeft: 2, paddingRight: 2 }}>
            <RateBar rate={rate} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: SUPPLY,
              fontSize: 9.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ color: "#3A4438" }}>{fmtTime(currentTime)}</span>
            <span
              style={{
                color: Math.abs(rate) > 0.05 ? "#7A9470" : "#3A4438",
                transition: "color 0.2s",
              }}
            >
              RATE {rate >= 0 ? "+" : ""}{rate.toFixed(2)}×
            </span>
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
            tapeColor={rate < -0.05 ? "#6B7A5A" : "#1C1A18"}
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

                {/* Rim goo layer — enlarged shapes in lighter sage, sits behind main blob */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    filter: "url(#liquid-goo)",
                    transform: "translateZ(0)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: BLOB_CX - (MAIN_D + BLOB_RIM) / 2,
                      top: BLOB_CY - (MAIN_D + BLOB_RIM) / 2,
                      width: MAIN_D + BLOB_RIM,
                      height: MAIN_D + BLOB_RIM,
                      borderRadius: "50%",
                      background: "#7D9468",
                    }}
                  />
                  <motion.div
                    style={{
                      position: "absolute",
                      left: bridgeLeft,
                      top: BLOB_CY - (BRIDGE_H + BLOB_RIM) / 2,
                      width: bridgeWidth,
                      height: BRIDGE_H + BLOB_RIM,
                      borderRadius: (BRIDGE_H + BLOB_RIM) / 2,
                      background: "#7D9468",
                    }}
                  />
                  <motion.div
                    style={{
                      position: "absolute",
                      left: BLOB_CX,
                      top: BLOB_CY,
                      width: SEC_D + BLOB_RIM,
                      height: SEC_D + BLOB_RIM,
                      borderRadius: "50%",
                      background: "#7D9468",
                      translateX: "-50%",
                      translateY: "-50%",
                      x: secFinalX,
                    }}
                  />
                </div>

                {/* Goo blob — main layer on top */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    filter: "url(#liquid-goo)",
                    transform: "translateZ(0)",
                  }}
                >
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
                      x: secFinalX,
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
                color: "#1C1A18",
                margin: 0,
              }}
            >
              DRAG — DISTANCE SETS RATE
            </p>
          </div>

          <Reel
            size={REEL_SIZE} fillRatio={rightFill} rotation={-reelAngle}
            tapeColor={rate > 0.05 ? "#6B7A5A" : "#1C1A18"}
          />
        </div>
      </div>
    </div>
  );
}
