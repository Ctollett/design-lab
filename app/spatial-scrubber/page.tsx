"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const LINE_W = 1;
const LINE_GAP = 1;
const LINE_COUNT = 320;
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
const WAVEFORM_W = LINE_COUNT * (LINE_W + LINE_GAP); // 640px

const REEL_SIZE = 176;
const WF_CENTER_Y = WAVEFORM_H / 2;
const WF_MAX_AMP = WAVEFORM_H / 2 - 6;
const MAX_DRAG = 180;

// Triple blob geometry: [RW sat] [center play/pause] [FF sat]
// BLOB_W trimmed to minimum needed: 2*(SAT_REST+MAX_SAT_DRAG+SAT_D/2)+margin = 292px
const BLOB_W = 292;
const BLOB_H = 124;
const BLOB_CX = 146;
const BLOB_CY = 62;
const CENTER_D = 72;
const SAT_D = 44;
const SAT_REST = 56;   // satellite rest offset from center (px)
const BRIDGE_H = 16;
const MAX_SAT_DRAG = 64;
const BLOB_RIM = 4;

// SAT_REST = CENTER_D/2 + SAT_D/2 - 2 → 2px goo-merge overlap at rest
// At rest: RW right edge = BLOB_CX - SAT_REST + SAT_D/2 = 112
//          Center left edge = BLOB_CX - CENTER_D/2 = 110 → 2px overlap → goo merges them

const REEL_ROW_W = WAVEFORM_W + 40; // 680px, matches card outer width
const TOTAL_SEC = 247;

function pad2(n: number) { return String(Math.floor(n)).padStart(2, "0"); }
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${pad2(m)}:${pad2(s)}`;
}

function PlayIcon() {
  return (
    <svg width={14} height={16} viewBox="0 0 14 16" fill="none">
      <polygon points="2,1 13,8 2,15" fill="#8AAA82" opacity={0.9} />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width={12} height={16} viewBox="0 0 12 16" fill="none">
      <rect x={1} y={1} width={3.5} height={14} rx={1.5} fill="#8AAA82" opacity={0.9} />
      <rect x={7.5} y={1} width={3.5} height={14} rx={1.5} fill="#8AAA82" opacity={0.9} />
    </svg>
  );
}

function RWIcon() {
  return (
    <svg width={12} height={10} viewBox="0 0 12 10" fill="none">
      <polyline points="11,1 7,5 11,9" stroke="#8AAA82" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      <polyline points="5,1 1,5 5,9" stroke="#8AAA82" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </svg>
  );
}

function FFIcon() {
  return (
    <svg width={12} height={10} viewBox="0 0 12 10" fill="none">
      <polyline points="1,1 5,5 1,9" stroke="#8AAA82" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      <polyline points="7,1 11,5 7,9" stroke="#8AAA82" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
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
          style={{ height: "100%", background: "#8AAA82", borderRadius: 2, opacity: 0.8, boxShadow: "0 0 4px rgba(100,155,70,0.30)" }}
          animate={{ width: isPos ? 0 : `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      </div>
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#4A6838", flexShrink: 0 }} />
      <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "flex-start" }}>
        <motion.div
          style={{ height: "100%", background: "#8AAA82", borderRadius: 2, opacity: 0.8, boxShadow: "0 0 4px rgba(100,155,70,0.30)" }}
          animate={{ width: isPos ? `${pct * 100}%` : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      </div>
    </div>
  );
}

// ---- Tape audio ----
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

  // Offline render — bake warmer, deeper source material
  useEffect(() => {
    const SR  = 44100;
    const DUR = 12;
    const oCtx = new OfflineAudioContext(1, SR * DUR, SR);

    const lowShelf = oCtx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 120;
    lowShelf.gain.value = 4;

    const warmPeak = oCtx.createBiquadFilter();
    warmPeak.type = "peaking";
    warmPeak.frequency.value = 240;
    warmPeak.gain.value = 9;
    warmPeak.Q.value = 0.85;

    const lpf = oCtx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 680;
    lpf.Q.value = 0.6;

    lowShelf.connect(warmPeak);
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
      g.connect(lowShelf);
      osc.start(t0);
      osc.stop(t1);
    };

    // Deeper chord pad
    ([[55, 0.10], [65.41, 0.08], [82.41, 0.07], [110, 0.055]] as [number, number][])
      .forEach(([f, v]) => note(f, "triangle", 0, DUR, v));

    const scale = [110, 130.81, 146.83, 164.81, 196.0, 220, 261.63];
    const pat   = [0, 2, 4, 6, 5, 3, 4, 2, 0, 1, 3, 5, 4, 2, 1, 0];
    const nl    = DUR / pat.length;
    pat.forEach((si, i) => note(scale[si], "triangle", i * nl, (i + 0.65) * nl, 0.12));

    [0, 3, 6, 9].forEach((t) => note(55, "sine", t, t + 2.4, 0.11));

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

    const fb  = fwdBuf.current;
    const rb  = ctx.createBuffer(1, fb.length, fb.sampleRate);
    const fd  = fb.getChannelData(0);
    const rd  = rb.getChannelData(0);
    for (let i = 0; i < fd.length; i++) rd[i] = fd[fd.length - 1 - i];

    // Synthetic reverb IR — 2.2s exponential decay
    const revLen = Math.floor(ctx.sampleRate * 2.2);
    const revBuf = ctx.createBuffer(2, revLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = revBuf.getChannelData(c);
      for (let i = 0; i < revLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / revLen, 1.8);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = revBuf;

    // Subtle tape saturation — gentle warmth, not crunch
    const satCurve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      satCurve[i] = (Math.PI + 18) * x / (Math.PI + 18 * Math.abs(x));
    }
    const saturator = ctx.createWaveShaper();
    saturator.curve = satCurve;
    saturator.oversample = "4x";

    // Warmth EQ — low shelf + presence peak + dark lowpass
    const lsf = ctx.createBiquadFilter();
    lsf.type = "lowshelf"; lsf.frequency.value = 130; lsf.gain.value = 3;

    const wpk = ctx.createBiquadFilter();
    wpk.type = "peaking"; wpk.frequency.value = 260; wpk.gain.value = 6; wpk.Q.value = 0.9;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 780; lp.Q.value = 0.6;

    // Tape echo — 210ms delay, feedback loop with darkening LPF
    const echoDelay = ctx.createDelay(1.0);
    echoDelay.delayTime.value = 0.21;
    const echoFeedback = ctx.createGain(); echoFeedback.gain.value = 0.38;
    const echoLPF = ctx.createBiquadFilter();
    echoLPF.type = "lowpass"; echoLPF.frequency.value = 1800; echoLPF.Q.value = 0.5;
    const echoWet = ctx.createGain(); echoWet.gain.value = 0.22;
    // feedback loop: delay → LPF → feedback gain → delay
    echoDelay.connect(echoLPF);
    echoLPF.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    // tap echo output to destination via wet gain
    echoLPF.connect(echoWet);
    echoWet.connect(ctx.destination);

    // Master gain (starts at 0, ramped on play)
    const mg = ctx.createGain();
    mg.gain.value = 0;
    master.current = mg;

    // Dry / wet split — 48% direct, 52% reverb
    const dryGain = ctx.createGain(); dryGain.gain.value = 0.48;
    const wetGain = ctx.createGain(); wetGain.gain.value = 0.52;

    // Chain: sources → master → EQ → saturator → dry + reverb + echo
    mg.connect(lsf);
    lsf.connect(wpk);
    wpk.connect(lp);
    lp.connect(saturator);
    saturator.connect(dryGain);
    saturator.connect(convolver);
    saturator.connect(echoDelay);
    dryGain.connect(ctx.destination);
    convolver.connect(wetGain);
    wetGain.connect(ctx.destination);

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

    // Tape hiss — lowered HPF cutoff for more analog presence
    const noiseLen = ctx.sampleRate * 2;
    const nBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd   = nBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = nBuf;
    ns.loop   = true;

    const hf = ctx.createBiquadFilter();
    hf.type = "highpass";
    hf.frequency.value = 2600;
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
    const hg  = hissGain.current;
    if (!ctx || !mg) return;
    const now = ctx.currentTime;
    mg.gain.cancelScheduledValues(now);
    mg.gain.linearRampToValueAtTime(0.82, now + 0.06);
    if (hg) { hg.gain.cancelScheduledValues(now); hg.gain.linearRampToValueAtTime(0.018, now + 0.3); }
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

    if (hg) hg.gain.value = Math.min(0.065, absRate * 0.012 + 0.018);
    if (hf) hf.frequency.value = 2600 + absRate * 1800;
  }, []);

  const tapeStop = useCallback(() => {
    const ctx = actx.current;
    const mg  = master.current;
    const hg  = hissGain.current;
    if (!ctx || !mg) return;
    const now = ctx.currentTime;
    mg.gain.cancelScheduledValues(now);
    mg.gain.linearRampToValueAtTime(0, now + 0.12);
    if (hg) { hg.gain.cancelScheduledValues(now); hg.gain.linearRampToValueAtTime(0, now + 0.6); }
    if (fwdSrc.current) fwdSrc.current.playbackRate.value = 0.01;
    if (revSrc.current) revSrc.current.playbackRate.value = 0.01;
  }, []);

  useEffect(() => { return () => { actx.current?.close().catch(() => {}); }; }, []);

  return { tapeStart, tapeUpdate, tapeStop };
}

export default function SpatialScrubber() {
  const [progress, setProgress] = useState(0.14);
  const [rate, setRate] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dragging, setDragging] = useState(false);

  const playingRef    = useRef(false);
  const activeBlobRef = useRef<"rw" | "ff" | null>(null);
  const isDragging    = useRef(false);
  const grabX         = useRef(0);
  const scrubRateRef  = useRef(0);
  const animRef       = useRef<number | null>(null);
  const lastTimeRef   = useRef(0);
  const grainRef      = useRef<HTMLDivElement>(null);

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

  // RW satellite — only drags left (negative x)
  const rwRaw    = useMotionValue(0);
  const rwSpring = useSpring(rwRaw, { stiffness: 600, damping: 28 });
  const rwFinalX = useTransform(rwSpring, (dx: number) =>
    -SAT_REST + Math.max(-MAX_SAT_DRAG, Math.min(0, dx * 0.5))
  );

  // FF satellite — only drags right (positive x)
  const ffRaw    = useMotionValue(0);
  const ffSpring = useSpring(ffRaw, { stiffness: 600, damping: 28 });
  const ffFinalX = useTransform(ffSpring, (dx: number) =>
    SAT_REST + Math.min(MAX_SAT_DRAG, Math.max(0, dx * 0.5))
  );

  // Bridge geometry — gap between satellite edge and center blob edge
  // gap = -(SAT_D/2 + CENTER_D/2 + x) = -(40 + x) for RW
  // Threshold = SAT_D/2 + CENTER_D/2 = 22 + 36 = 58
  const rwBridgeLeft  = useTransform(rwFinalX, (x: number) => BLOB_CX + x + SAT_D / 2);
  const rwBridgeWidth = useTransform(rwFinalX, (x: number) => Math.max(0, -(58 + x)));
  const FF_BRIDGE_LEFT = BLOB_CX + CENTER_D / 2; // 182px, constant
  const ffBridgeWidth = useTransform(ffFinalX, (x: number) => Math.max(0, x - 58));

  useEffect(() => { playingRef.current = playing; }, [playing]);

  // Stop at track end
  useEffect(() => {
    if (progress >= 1 && playing) {
      setPlaying(false);
      playingRef.current = false;
      scrubRateRef.current = 0;
    }
  }, [progress, playing]);

  const startLoop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      const r = scrubRateRef.current;
      if (r !== 0) {
        setProgress(p => Math.max(0, Math.min(1, p + r * dt)));
      }
      if (scrubRateRef.current !== 0 || isDragging.current) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLoop = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying(p => {
      const next = !p;
      playingRef.current = next;
      if (next) {
        scrubRateRef.current = 1 / TOTAL_SEC;
        startLoop();
      } else {
        scrubRateRef.current = 0;
      }
      return next;
    });
  }, [startLoop]);

  const onBlobPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect    = e.currentTarget.getBoundingClientRect();
    const localX  = e.clientX - rect.left;
    const localY  = e.clientY - rect.top;

    const rwCX = BLOB_CX + rwFinalX.get();
    const ffCX = BLOB_CX + ffFinalX.get();

    const dRW = Math.hypot(localX - rwCX, localY - BLOB_CY);
    const dFF = Math.hypot(localX - ffCX, localY - BLOB_CY);
    const dC  = Math.hypot(localX - BLOB_CX, localY - BLOB_CY);

    if (dC <= CENTER_D / 2 + 4) {
      togglePlay();
      return;
    }

    const hitRW = dRW <= SAT_D / 2 + 10;
    const hitFF = dFF <= SAT_D / 2 + 10;
    if (!hitRW && !hitFF) return;

    const which: "rw" | "ff" = (hitRW && hitFF)
      ? (dRW <= dFF ? "rw" : "ff")
      : (hitRW ? "rw" : "ff");

    activeBlobRef.current = which;
    isDragging.current    = true;
    setDragging(true);
    grabX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);

    scrubRateRef.current = 0;
    tapeStart();
    startLoop();
  }, [rwFinalX, ffFinalX, togglePlay, tapeStart, startLoop]);

  const onBlobPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - grabX.current;

    if (activeBlobRef.current === "rw") {
      const raw = Math.max(-MAX_DRAG, Math.min(0, dx));
      rwRaw.set(raw);
      const t  = -raw / MAX_DRAG;
      scrubRateRef.current = -t * 1.2;
      const rv = -t * 4;
      setRate(rv);
      tapeUpdate(rv);
    } else if (activeBlobRef.current === "ff") {
      const raw = Math.max(0, Math.min(MAX_DRAG, dx));
      ffRaw.set(raw);
      const t  = raw / MAX_DRAG;
      scrubRateRef.current = t * 1.2;
      const rv = t * 4;
      setRate(rv);
      tapeUpdate(rv);
    }
  }, [rwRaw, ffRaw, tapeUpdate]);

  const onBlobPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    const which = activeBlobRef.current;
    activeBlobRef.current = null;

    if (which === "rw") rwRaw.set(0);
    else if (which === "ff") ffRaw.set(0);

    tapeStop();
    setRate(0);

    const coastV = { v: scrubRateRef.current };
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }

    let lastT = performance.now();
    const coast = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      coastV.v *= Math.exp(-10 * dt);
      setProgress(p => Math.max(0, Math.min(1, p + coastV.v * dt)));
      if (Math.abs(coastV.v) > 0.003) {
        animRef.current = requestAnimationFrame(coast);
      } else {
        animRef.current = null;
        if (playingRef.current) {
          scrubRateRef.current = 1 / TOTAL_SEC;
          startLoop();
        } else {
          scrubRateRef.current = 0;
        }
      }
    };
    animRef.current = requestAnimationFrame(coast);
  }, [rwRaw, ffRaw, tapeStop, startLoop]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  const playheadX   = progress * WAVEFORM_W;
  const leftFill    = 0.12 + progress * 0.72;
  const rightFill   = 0.84 - progress * 0.72;
  const reelAngle   = progress * 900;
  const currentTime = progress * TOTAL_SEC;

  const rwActive = rate < -0.05;
  const ffActive = rate > 0.05;

  const MONO   = "var(--font-mdui), monospace";
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
          top: 20,
          right: 24,
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
          marginBottom: 72,
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
          }}
        >
          {/* Glass screen sheen */}
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
              color: "#7AAF52",
              textShadow: "0 0 8px rgba(90, 140, 100, 0.28)",
              marginBottom: 14,
            }}
          >
            NEW SESSION #032
          </div>

          <div style={{ position: "relative", width: WAVEFORM_W, height: WAVEFORM_H }}>
            <svg width={WAVEFORM_W} height={WAVEFORM_H} style={{ display: "block", filter: "drop-shadow(0 0 5px rgba(90, 140, 100, 0.22))" }}>
              <defs>
                <clipPath id="wf-past">
                  <rect x={0} y={0} width={playheadX} height={WAVEFORM_H} />
                </clipPath>
              </defs>
              {BARS.map((h, i) => {
                const x  = i * (BAR_W + BAR_GAP);
                const bh = Math.round(Math.max(1, h * WF_MAX_AMP * 2) * 100) / 100;
                return (
                  <rect key={i} x={x} y={WF_CENTER_Y - bh / 2} width={BAR_W} height={bh}
                    fill="#8AAA82" opacity={0.18} />
                );
              })}
              <g clipPath="url(#wf-past)">
                {BARS.map((h, i) => {
                  const x  = i * (BAR_W + BAR_GAP);
                  const bh = Math.round(Math.max(1, h * WF_MAX_AMP * 2) * 100) / 100;
                  return (
                    <rect key={i} x={x} y={WF_CENTER_Y - bh / 2} width={BAR_W} height={bh}
                      fill="#8AAA82" opacity={0.82} />
                  );
                })}
              </g>
              <line
                x1={playheadX} y1={4} x2={playheadX} y2={WAVEFORM_H - 4}
                stroke="#8AAA82" strokeWidth={1.5} strokeLinecap="round" opacity={0.9}
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
            <span style={{ color: "#5A8040", textShadow: "0 0 6px rgba(90, 140, 100, 0.22)" }}>{fmtTime(currentTime)}</span>
            <span
              style={{
                color: Math.abs(rate) > 0.05 ? "#8AAA82" : "#5A8040",
                textShadow: Math.abs(rate) > 0.05 ? "0 0 8px rgba(90, 140, 100, 0.30)" : "none",
                transition: "color 0.2s, text-shadow 0.2s",
              }}
            >
              RATE {rate >= 0 ? "+" : ""}{rate.toFixed(2)}×
            </span>
          </div>
        </div>

        {/* Reels + triple-blob row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: REEL_ROW_W,
            paddingTop: 8,
          }}
        >
          <Reel
            size={REEL_SIZE} fillRatio={leftFill} rotation={reelAngle}
            tapeColor={rwActive ? "#6B7A5A" : "#1C1A18"}
          />

          {/* Triple-blob scrubber — marginTop offsets so blob center aligns with reel center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 72, marginTop: (REEL_SIZE - BLOB_H) / 2 }}>
            <div
              style={{
                position: "relative",
                width: BLOB_W,
                height: BLOB_H,
                cursor: dragging ? "grabbing" : "pointer",
              }}
              onPointerDown={onBlobPointerDown}
              onPointerMove={onBlobPointerMove}
              onPointerUp={onBlobPointerUp}
              onPointerLeave={onBlobPointerUp}
            >
              {/* Rim goo layer — sits behind main layer, gives a thin rim */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: "url(#liquid-goo)",
                  transform: "translateZ(0)",
                }}
              >
                {/* RW satellite rim */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: BLOB_CX,
                    top: BLOB_CY,
                    width: SAT_D + BLOB_RIM,
                    height: SAT_D + BLOB_RIM,
                    borderRadius: "50%",
                    background: "#1A1816",
                    translateX: "-50%",
                    translateY: "-50%",
                    x: rwFinalX,
                  }}
                />
                {/* RW bridge rim */}
                <motion.div
                  style={{
                    position: "absolute",
                    top: BLOB_CY - (BRIDGE_H + BLOB_RIM) / 2,
                    height: BRIDGE_H + BLOB_RIM,
                    borderRadius: (BRIDGE_H + BLOB_RIM) / 2,
                    background: "#1A1816",
                    left: rwBridgeLeft,
                    width: rwBridgeWidth,
                  }}
                />
                {/* Center blob rim */}
                <div
                  style={{
                    position: "absolute",
                    left: BLOB_CX - (CENTER_D + BLOB_RIM) / 2,
                    top: BLOB_CY - (CENTER_D + BLOB_RIM) / 2,
                    width: CENTER_D + BLOB_RIM,
                    height: CENTER_D + BLOB_RIM,
                    borderRadius: "50%",
                    background: "#1A1816",
                  }}
                />
                {/* FF bridge rim */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: FF_BRIDGE_LEFT,
                    top: BLOB_CY - (BRIDGE_H + BLOB_RIM) / 2,
                    height: BRIDGE_H + BLOB_RIM,
                    borderRadius: (BRIDGE_H + BLOB_RIM) / 2,
                    background: "#1A1816",
                    width: ffBridgeWidth,
                  }}
                />
                {/* FF satellite rim */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: BLOB_CX,
                    top: BLOB_CY,
                    width: SAT_D + BLOB_RIM,
                    height: SAT_D + BLOB_RIM,
                    borderRadius: "50%",
                    background: "#1A1816",
                    translateX: "-50%",
                    translateY: "-50%",
                    x: ffFinalX,
                  }}
                />
              </div>

              {/* Main goo layer */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: "url(#liquid-goo)",
                  transform: "translateZ(0)",
                }}
              >
                {/* RW satellite */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: BLOB_CX,
                    top: BLOB_CY,
                    width: SAT_D,
                    height: SAT_D,
                    borderRadius: "50%",
                    background: "#1C1A18",
                    translateX: "-50%",
                    translateY: "-50%",
                    x: rwFinalX,
                  }}
                />
                {/* RW bridge */}
                <motion.div
                  style={{
                    position: "absolute",
                    top: BLOB_CY - BRIDGE_H / 2,
                    height: BRIDGE_H,
                    borderRadius: BRIDGE_H / 2,
                    background: "#1C1A18",
                    left: rwBridgeLeft,
                    width: rwBridgeWidth,
                  }}
                />
                {/* Center blob */}
                <div
                  style={{
                    position: "absolute",
                    left: BLOB_CX - CENTER_D / 2,
                    top: BLOB_CY - CENTER_D / 2,
                    width: CENTER_D,
                    height: CENTER_D,
                    borderRadius: "50%",
                    background: "#1C1A18",
                  }}
                />
                {/* FF bridge */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: FF_BRIDGE_LEFT,
                    top: BLOB_CY - BRIDGE_H / 2,
                    height: BRIDGE_H,
                    borderRadius: BRIDGE_H / 2,
                    background: "#1C1A18",
                    width: ffBridgeWidth,
                  }}
                />
                {/* FF satellite */}
                <motion.div
                  style={{
                    position: "absolute",
                    left: BLOB_CX,
                    top: BLOB_CY,
                    width: SAT_D,
                    height: SAT_D,
                    borderRadius: "50%",
                    background: "#1C1A18",
                    translateX: "-50%",
                    translateY: "-50%",
                    x: ffFinalX,
                  }}
                />
              </div>

              {/* Satellite travel tracks — hairline rails + limit ticks */}
              {/* RW track: rest position → max drag limit (leftward) */}
              <div aria-hidden style={{ position: "absolute", pointerEvents: "none" }}>
                {/* RW rail */}
                <div style={{
                  position: "absolute",
                  left: BLOB_CX - SAT_REST - MAX_SAT_DRAG,
                  top: BLOB_CY - 0.5,
                  width: MAX_SAT_DRAG,
                  height: 1,
                  background: "#1C1A18",
                  opacity: 0.28,
                  borderRadius: 1,
                }} />
                {/* RW limit tick */}
                <div style={{
                  position: "absolute",
                  left: BLOB_CX - SAT_REST - MAX_SAT_DRAG - 0.5,
                  top: BLOB_CY - 7,
                  width: 1,
                  height: 14,
                  background: "#1C1A18",
                  opacity: 0.42,
                  borderRadius: 1,
                }} />
                {/* FF rail */}
                <div style={{
                  position: "absolute",
                  left: BLOB_CX + SAT_REST,
                  top: BLOB_CY - 0.5,
                  width: MAX_SAT_DRAG,
                  height: 1,
                  background: "#1C1A18",
                  opacity: 0.28,
                  borderRadius: 1,
                }} />
                {/* FF limit tick */}
                <div style={{
                  position: "absolute",
                  left: BLOB_CX + SAT_REST + MAX_SAT_DRAG - 0.5,
                  top: BLOB_CY - 7,
                  width: 1,
                  height: 14,
                  background: "#1C1A18",
                  opacity: 0.42,
                  borderRadius: 1,
                }} />
              </div>

              {/* Icon overlays — above goo, pointer-events: none */}
              {/* Center: play / pause */}
              <div
                style={{
                  position: "absolute",
                  left: BLOB_CX - CENTER_D / 2,
                  top: BLOB_CY - CENTER_D / 2,
                  width: CENTER_D,
                  height: CENTER_D,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </div>
              {/* RW icon — tracks satellite */}
              <motion.div
                style={{
                  position: "absolute",
                  left: BLOB_CX,
                  top: BLOB_CY,
                  width: SAT_D,
                  height: SAT_D,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  translateX: "-50%",
                  translateY: "-50%",
                  x: rwFinalX,
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <RWIcon />
              </motion.div>
              {/* FF icon — tracks satellite */}
              <motion.div
                style={{
                  position: "absolute",
                  left: BLOB_CX,
                  top: BLOB_CY,
                  width: SAT_D,
                  height: SAT_D,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  translateX: "-50%",
                  translateY: "-50%",
                  x: ffFinalX,
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              >
                <FFIcon />
              </motion.div>
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
              TAP TO PLAY · DRAG TO SCRUB
            </p>
          </div>

          <Reel
            size={REEL_SIZE} fillRatio={rightFill} rotation={-reelAngle}
            tapeColor={ffActive ? "#6B7A5A" : "#1C1A18"}
          />
        </div>
      </div>
    </div>
  );
}
