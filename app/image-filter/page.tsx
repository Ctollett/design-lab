"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./image-filter.module.css";

// ── Curve math ────────────────────────────────────────────────────────────────

type CurvePoint = { x: number; y: number };
type Channel = "rgb" | "r" | "g" | "b";
type Tool = "curve" | "tone" | "color" | "hsl" | "detail";

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function evaluateCurve(sorted: CurvePoint[], x: number): number {
  if (x <= sorted[0].x) return sorted[0].y;
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;
  let i = 0;
  while (i < sorted.length - 2 && sorted[i + 1].x <= x) i++;
  const p0 = sorted[Math.max(0, i - 1)];
  const p1 = sorted[i];
  const p2 = sorted[i + 1];
  const p3 = sorted[Math.min(sorted.length - 1, i + 2)];
  const t = (x - p1.x) / (p2.x - p1.x);
  const t2 = t * t, t3 = t2 * t;
  return clamp01(0.5 * (
    2 * p1.y + (-p0.y + p2.y) * t +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  ));
}

// ── Slider ────────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const update = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(Math.round(min + clamp01((clientX - rect.left) / rect.width) * (max - min)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    update(e.clientX);
    const onMove = (ev: PointerEvent) => update(ev.clientX);
    const onUp = () => window.removeEventListener("pointermove", onMove);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const fmt = (v: number) => (v > 0 ? `+${v}` : `${v}`);

  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderMeta}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{fmt(value)}</span>
      </div>
      <div ref={trackRef} className={styles.sliderTrack} onPointerDown={onPointerDown}>
        <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
        <div className={styles.sliderThumb} style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Tool panels ───────────────────────────────────────────────────────────────

function TonePanel() {
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  return (
    <div className={styles.sliderPanel}>
      <Slider label="Brightness" value={brightness} min={-100} max={100} onChange={setBrightness} />
      <Slider label="Contrast"   value={contrast}   min={-100} max={100} onChange={setContrast} />
    </div>
  );
}

function ColorPanel() {
  const [temp, setTemp] = useState(0);
  const [tint, setTint] = useState(0);
  return (
    <div className={styles.sliderPanel}>
      <Slider label="Temperature" value={temp} min={-100} max={100} onChange={setTemp} />
      <Slider label="Tint"        value={tint} min={-100} max={100} onChange={setTint} />
    </div>
  );
}

function HSLPanel() {
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(0);
  return (
    <div className={styles.sliderPanel}>
      <Slider label="Hue"        value={hue} min={-100} max={100} onChange={setHue} />
      <Slider label="Saturation" value={sat} min={-100} max={100} onChange={setSat} />
    </div>
  );
}

function DetailPanel() {
  const [sharp, setSharp] = useState(0);
  const [noise, setNoise] = useState(0);
  return (
    <div className={styles.sliderPanel}>
      <Slider label="Sharpness" value={sharp} min={0} max={100} onChange={setSharp} />
      <Slider label="Noise"     value={noise} min={0} max={100} onChange={setNoise} />
    </div>
  );
}

// ── Curves Editor ─────────────────────────────────────────────────────────────

const CURVE_W = 256; // 280px - 12px padding each side
const CURVE_H = 158;
const STRIP_H = 5;

const CHANNEL_COLOR: Record<Channel, string> = {
  rgb: "rgba(255,255,247,0.85)",
  r:   "rgba(255,90,70,0.9)",
  g:   "rgba(90,200,100,0.9)",
  b:   "rgba(80,145,255,0.9)",
};

function CurvesEditor({ points, onChange, channel }: {
  points: CurvePoint[]; onChange: (pts: CurvePoint[]) => void; channel: Channel;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const didDrag = useRef(false);
  const [readout, setReadout] = useState<{ x: number; y: number } | null>(null);

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const curveColor = CHANNEL_COLOR[channel];

  const path = (() => {
    const pts = Array.from({ length: 64 }, (_, i) => {
      const x = i / 63;
      const y = evaluateCurve(sorted, x);
      return `${(x * CURVE_W).toFixed(1)},${((1 - y) * CURVE_H).toFixed(1)}`;
    });
    return `M ${pts.join(" L ")}`;
  })();

  const onPointDown = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    didDrag.current = false;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const lockLeft = points[idx].x <= 0.001;
    const lockRight = points[idx].x >= 0.999;
    dragging.current = idx;
    const onMove = (ev: PointerEvent) => {
      if (dragging.current === null) return;
      didDrag.current = true;
      const pos = {
        x: lockLeft ? 0 : lockRight ? 1 : clamp01((ev.clientX - rect.left) / CURVE_W),
        y: clamp01(1 - (ev.clientY - rect.top) / CURVE_H),
      };
      setReadout({ x: Math.round(pos.x * 255), y: Math.round(pos.y * 255) });
      onChange(points.map((p, i) => i === dragging.current ? pos : p));
    };
    const onUp = () => {
      dragging.current = null;
      setReadout(null);
      window.removeEventListener("pointermove", onMove);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const onSVGClick = (e: React.MouseEvent) => {
    if (didDrag.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientY - rect.top > CURVE_H) return;
    if (points.length >= 4) return;
    const x = clamp01((e.clientX - rect.left) / CURVE_W);
    if (x <= 0.03 || x >= 0.97) return;
    if (points.some(p => Math.abs(p.x - x) < 0.04)) return;
    onChange([...points, { x, y: evaluateCurve(sorted, x) }]);
  };

  const onPointDoubleClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const pt = points[idx];
    if (pt.x <= 0.001 || pt.x >= 0.999) return;
    onChange(points.filter((_, i) => i !== idx));
  };

  const PAD = 5;
  return (
    <svg ref={svgRef}
      viewBox={`${-PAD} ${-PAD} ${CURVE_W + PAD * 2} ${CURVE_H + STRIP_H + PAD}`}
      width={CURVE_W} height={CURVE_H + STRIP_H}
      className={styles.curveSvg} onClick={onSVGClick}>
      <defs>
        <linearGradient id="if-grad-x" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(v => (
        <g key={v}>
          <line x1={v * CURVE_W} y1={0} x2={v * CURVE_W} y2={CURVE_H} stroke="rgba(255,255,247,0.06)" strokeWidth="0.5" />
          <line x1={0} y1={v * CURVE_H} x2={CURVE_W} y2={v * CURVE_H} stroke="rgba(255,255,247,0.06)" strokeWidth="0.5" />
        </g>
      ))}
      <line x1={0} y1={CURVE_H} x2={CURVE_W} y2={0} stroke="rgba(255,255,247,0.1)" strokeWidth="0.5" strokeDasharray="3 3" />
      <path d={`${path} L ${CURVE_W},${CURVE_H} L 0,${CURVE_H} Z`} fill="rgba(255,255,247,0.04)" />
      <path d={path} stroke={curveColor} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((pt, i) => (
        <circle key={i}
          cx={pt.x * CURVE_W}
          cy={(1 - pt.y) * CURVE_H}
          r={3.5}
          fill="#171717" stroke={curveColor} strokeWidth="1"
          style={{ cursor: "crosshair" }}
          onPointerDown={e => onPointDown(e, i)}
          onDoubleClick={e => onPointDoubleClick(e, i)}
        />
      ))}
      {readout && (
        <text x={CURVE_W - 3} y={11} textAnchor="end"
          fill="rgba(255,255,247,0.4)"
          fontFamily="var(--font-pp-supply-mono), monospace"
          fontSize="7" letterSpacing="0.08em">
          {readout.x} → {readout.y}
        </text>
      )}
      <rect x={0} y={CURVE_H} width={CURVE_W} height={STRIP_H} fill="url(#if-grad-x)" opacity={0.35} />
    </svg>
  );
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function AdjustIcon({ isOpen }: { isOpen: boolean }) {
  const spring = { type: "spring", stiffness: 380, damping: 34 } as const;
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <motion.line stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        animate={isOpen ? { x1: 2, y1: 2, x2: 11, y2: 11 } : { x1: 1, y1: 3, x2: 12, y2: 3 }} transition={spring} />
      <motion.line stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        animate={isOpen ? { x1: 6.5, y1: 6.5, x2: 6.5, y2: 6.5, opacity: 0 } : { x1: 1, y1: 6.5, x2: 12, y2: 6.5, opacity: 1 }} transition={spring} />
      <motion.line stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        animate={isOpen ? { x1: 11, y1: 2, x2: 2, y2: 11 } : { x1: 1, y1: 10, x2: 12, y2: 10 }} transition={spring} />
      <motion.circle cy={3}   r={1.5} fill="currentColor" animate={{ cx: isOpen ? 6.5 : 4,   opacity: isOpen ? 0 : 1 }} transition={spring} />
      <motion.circle cy={6.5} r={1.5} fill="currentColor" animate={{ cx: isOpen ? 6.5 : 9,   opacity: isOpen ? 0 : 1 }} transition={spring} />
      <motion.circle cy={10}  r={1.5} fill="currentColor" animate={{ cx: isOpen ? 6.5 : 5.5, opacity: isOpen ? 0 : 1 }} transition={spring} />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type CurveState = Record<Channel, CurvePoint[]>;
const fresh = (): CurvePoint[] => [{ x: 0, y: 0 }, { x: 1, y: 1 }];

const OPEN_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

const TOOL_HEIGHTS: Record<Tool, number> = {
  curve:  210,
  tone:   100,
  color:  100,
  hsl:    100,
  detail: 100,
};

const TOOLS: { id: Tool; label: string }[] = [
  { id: "curve",  label: "Curve" },
  { id: "tone",   label: "Tone" },
  { id: "color",  label: "Color" },
  { id: "hsl",    label: "HSL" },
  { id: "detail", label: "Detail" },
];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "rgb", label: "RGB" },
  { id: "r",   label: "R" },
  { id: "g",   label: "G" },
  { id: "b",   label: "B" },
];

const spring = { type: "spring", stiffness: 380, damping: 34 } as const;

export default function ImageFilterPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("curve");
  const [channel, setChannel] = useState<Channel>("rgb");
  const [curves, setCurves] = useState<CurveState>({
    rgb: fresh(), r: fresh(), g: fresh(), b: fresh(),
  });

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.panel}
        animate={{ width: isOpen ? OPEN_WIDTH : COLLAPSED_WIDTH }}
        transition={spring}
      >
        {/* ── Toolbar row ── */}
        <div
          className={styles.header}
          onClick={!isOpen ? () => setIsOpen(true) : undefined}
          style={{ cursor: isOpen ? "default" : "pointer" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {!isOpen ? (
              <motion.span key="label" className={styles.headerLabel}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}>
                Adjust
              </motion.span>
            ) : (
              <motion.div key="tools" className={styles.toolbarTools}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}>
                {TOOLS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`${styles.toolBtn} ${activeTool === id ? styles.toolBtnActive : ""}`}
                    onClick={e => { e.stopPropagation(); setActiveTool(id); }}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className={styles.headerIcon}
            onClick={e => { e.stopPropagation(); setIsOpen(o => !o); }}
            animate={{ opacity: isOpen ? 0.7 : 0.35 }}
            transition={{ duration: 0.15 }}
          >
            <AdjustIcon isOpen={isOpen} />
          </motion.button>
        </div>

        {/* ── Controls ── */}
        <motion.div
          className={styles.controls}
          animate={isOpen
            ? { opacity: 1, filter: "blur(0px)", height: TOOL_HEIGHTS[activeTool], paddingBottom: 12 }
            : { opacity: 0, filter: "blur(6px)", height: 0, paddingBottom: 0 }
          }
          initial={false}
          transition={spring}
          style={{ overflow: "hidden", pointerEvents: isOpen ? "auto" : "none" }}
        >
          <div className={styles.controlsDivider} />

          {activeTool === "curve" && (
            <>
              <div className={styles.channelRow}>
                {CHANNELS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`${styles.channelBtn} ${channel === id ? styles.channelBtnActive : ""}`}
                    onClick={() => setChannel(id)}
                    style={channel === id ? { color: CHANNEL_COLOR[id] } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <CurvesEditor
                key={channel}
                points={curves[channel]}
                onChange={pts => setCurves(c => ({ ...c, [channel]: pts }))}
                channel={channel}
              />
            </>
          )}
          {activeTool === "tone"   && <TonePanel />}
          {activeTool === "color"  && <ColorPanel />}
          {activeTool === "hsl"    && <HSLPanel />}
          {activeTool === "detail" && <DetailPanel />}
        </motion.div>
      </motion.div>

      <div className={styles.cornerLabel}>
        Component.12<br />
        <span style={{ opacity: 0.5 }}>Tonal Curves</span>
      </div>
    </div>
  );
}
