"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const SANS = "var(--font-mdui), sans-serif";
const MONO = "var(--font-pp-supply-mono), monospace";
const SIZE = 300;

const ALBUMS = [
  { image: "/ruun-showcase/ulver.jpg",            song: "IV",                        title: "Nattens Madrigal",   artist: "Ulver",                  year: "1997", time: "1:47", total: "5:02", pct: "35%" },
  { image: "/ruun-showcase/hex.png",              song: "Absent Friend",             title: "Hex",                artist: "Bark Psychosis",          year: "1994", time: "2:14", total: "8:43", pct: "26%" },
  { image: "/ruun-showcase/boardsofcanada.webp",  song: "Music is Math",             title: "Geogaddi",           artist: "Boards of Canada",        year: "2002", time: "1:22", total: "5:44", pct: "24%" },
  { image: "/ruun-showcase/slowdive.jpeg",        song: "When the Sun Hits",         title: "Souvlaki",           artist: "Slowdive",                year: "1993", time: "2:33", total: "7:18", pct: "35%" },
  { image: "/ruun-showcase/bilindabutchers.jpg",  song: "Hai Bby",                   title: "Goodbyes",           artist: "The Bilinda Butchers",    year: "2012", time: "0:38", total: "3:14", pct: "20%" },
  { image: "/ruun-showcase/longseason.jpeg",      song: "LONG SEASON",               title: "LONG SEASON",        artist: "Fishmans",                year: "1996", time: "1:05", total: "6:21", pct: "17%" },
];

// ── SVG morph targets (Phosphor Icons, thin weight, viewBox 0 0 256 256) ─────

const PLAY  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"/></svg>`;
const PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z"/></svg>`;

const VOLUME      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55Zm54-106.08a40,40,0,0,1,0,52.88,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.72,8,8,0,0,1,12-10.58ZM248,128a79.9,79.9,0,0,1-20.37,53.34,8,8,0,0,1-11.92-10.67,64,64,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67A79.83,79.83,0,0,1,248,128Z"/></svg>`;
const VOLUME_LOW  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55ZM208,128a39.93,39.93,0,0,1-10,26.46,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.72,8,8,0,1,1,12-10.58A40,40,0,0,1,208,128Z"/></svg>`;
const VOLUME_MUTE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M53.92,34.62A8,8,0,1,0,42.08,45.38L73.55,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V175.09l42.08,46.29a8,8,0,1,0,11.84-10.76ZM32,96H72v64H32ZM144,207.64,88,164.09V95.89l56,61.6Zm42-63.77a24,24,0,0,0,0-31.72,8,8,0,1,1,12-10.57,40,40,0,0,1,0,52.88,8,8,0,0,1-12-10.59Zm-80.16-76a8,8,0,0,1,1.4-11.23l39.85-31A8,8,0,0,1,160,32v74.83a8,8,0,0,1-16,0V48.36l-26.94,21A8,8,0,0,1,105.84,67.91ZM248,128a79.9,79.9,0,0,1-20.37,53.34,8,8,0,0,1-11.92-10.67,64,64,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67A79.83,79.83,0,0,1,248,128Z"/></svg>`;

const REPEAT       = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M24,128A72.08,72.08,0,0,1,96,56H204.69L194.34,45.66a8,8,0,0,1,11.32-11.32l24,24a8,8,0,0,1,0,11.32l-24,24a8,8,0,0,1-11.32-11.32L204.69,72H96a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0Zm200-8a8,8,0,0,0-8,8,56.06,56.06,0,0,1-56,56H51.31l10.35-10.34a8,8,0,0,0-11.32-11.32l-24,24a8,8,0,0,0,0,11.32l24,24a8,8,0,0,0,11.32-11.32L51.31,200H160a72.08,72.08,0,0,0,72-72A8,8,0,0,0,224,120Z"/></svg>`;
const REPEAT_ONCE  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M24,128A72.08,72.08,0,0,1,96,56H204.69L194.34,45.66a8,8,0,0,1,11.32-11.32l24,24a8,8,0,0,1,0,11.32l-24,24a8,8,0,0,1-11.32-11.32L204.69,72H96a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0Zm200-8a8,8,0,0,0-8,8,56.06,56.06,0,0,1-56,56H51.31l10.35-10.34a8,8,0,0,0-11.32-11.32l-24,24a8,8,0,0,0,0,11.32l24,24a8,8,0,0,0,11.32-11.32L51.31,200H160a72.08,72.08,0,0,0,72-72A8,8,0,0,0,224,120Zm-88,40a8,8,0,0,0,8-8V104a8,8,0,0,0-11.58-7.16l-16,8a8,8,0,1,0,7.16,14.31l4.42-2.21V152A8,8,0,0,0,136,160Z"/></svg>`;
const SHUFFLE         = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M237.66,178.34a8,8,0,0,1,0,11.32l-24,24a8,8,0,0,1-11.32-11.32L212.69,192H200.94a72.12,72.12,0,0,1-58.59-30.15l-41.72-58.4A56.1,56.1,0,0,0,55.06,80H32a8,8,0,0,1,0-16H55.06a72.12,72.12,0,0,1,58.59,30.15l41.72,58.4A56.1,56.1,0,0,0,200.94,176h11.75l-10.35-10.34a8,8,0,0,1,11.32-11.32ZM143,107a8,8,0,0,0,11.16-1.86l1.2-1.67A56.1,56.1,0,0,1,200.94,80h11.75L202.34,90.34a8,8,0,0,0,11.32,11.32l24-24a8,8,0,0,0,0-11.32l-24-24a8,8,0,0,0-11.32,11.32L212.69,64H200.94a72.12,72.12,0,0,0-58.59,30.15l-1.2,1.67A8,8,0,0,0,143,107Zm-30,42a8,8,0,0,0-11.16,1.86l-1.2,1.67A56.1,56.1,0,0,1,55.06,176H32a8,8,0,0,0,0,16H55.06a72.12,72.12,0,0,0,58.59-30.15l1.2-1.67A8,8,0,0,0,113,149Z"/></svg>`;
const ARROWS_CLOCKWISE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z"/></svg>`;

const QUEUE       = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M32,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,64Zm104,56H40a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Zm0,64H40a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Zm112-24a8,8,0,0,1-3.76,6.78l-64,40A8,8,0,0,1,168,200V120a8,8,0,0,1,12.24-6.78l64,40A8,8,0,0,1,248,160Zm-23.09,0L184,134.43v51.14Z"/></svg>`;
const SKIP_BACK   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M208,47.88V208.12a16,16,0,0,1-24.43,13.43L64,146.77V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0v69.23L183.57,34.45A15.95,15.95,0,0,1,208,47.88Z"/></svg>`;
const SKIP_FWD    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M208,40V216a8,8,0,0,1-16,0V146.77L72.43,221.55A15.95,15.95,0,0,1,48,208.12V47.88A15.95,15.95,0,0,1,72.43,34.45L192,109.23V40a8,8,0,0,1,16,0Z"/></svg>`;
const REWIND      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M232,71.84V184.16a15.92,15.92,0,0,1-24.48,13.34L128,146.86v37.3a15.92,15.92,0,0,1-24.48,13.34L15.33,141.34a15.8,15.8,0,0,1,0-26.68L103.52,58.5A15.91,15.91,0,0,1,128,71.84v37.3L207.52,58.5A15.91,15.91,0,0,1,232,71.84Z"/></svg>`;
const FAST_FWD    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M256,128a15.76,15.76,0,0,1-7.33,13.34L160.48,197.5A15.91,15.91,0,0,1,136,184.16v-37.3L56.48,197.5A15.91,15.91,0,0,1,32,184.16V71.84A15.91,15.91,0,0,1,56.48,58.5L136,109.14V71.84A15.91,15.91,0,0,1,160.48,58.5l88.19,56.16A15.76,15.76,0,0,1,256,128Z"/></svg>`;
const WAVEFORM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z"/></svg>`;

const PLUS  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>`;
const CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>`;

const CHEV_L1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>`;
const CHEV_L2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M205.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L131.31,128ZM51.31,128l74.35-74.34a8,8,0,0,0-11.32-11.32l-80,80a8,8,0,0,0,0,11.32l80,80a8,8,0,0,0,11.32-11.32Z"/></svg>`;
const CHEV_R1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>`;
const CHEV_R2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M141.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L124.69,128,50.34,53.66A8,8,0,0,1,61.66,42.34l80,80A8,8,0,0,1,141.66,133.66Zm80-11.32-80-80a8,8,0,0,0-11.32,11.32L204.69,128l-74.35,74.34a8,8,0,0,0,11.32,11.32l80-80A8,8,0,0,0,221.66,122.34Z"/></svg>`;

// ── Hook ──────────────────────────────────────────────────────────────────────

function useMorphSvg(initial: string) {
  const ref    = useRef<SVGSVGElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || !ref.current) return;
    seeded.current = true;
    import("getruun").then(({ initMorphSvg }) => {
      if (ref.current) initMorphSvg(ref.current, initial);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const to = useCallback((target: string, preset: string | { stiffness: number; damping: number; mass: number } = "smooth") => {
    if (!ref.current) return;
    import("getruun").then(({ morphSvg }) => {
      if (ref.current) morphSvg(ref.current, target, preset);
    });
  }, []);

  return { ref, to };
}

// ── Icon button ───────────────────────────────────────────────────────────────

function Btn({ onClick, onMouseDown, onMouseUp, onMouseLeave, children, color = "#1A1714", px = 8 }: {
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
  color?: string;
  px?: number;
}) {
  return (
    <button onClick={onClick} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave} style={{
      background: "none", border: "none", cursor: "pointer",
      paddingTop: 8, paddingBottom: 8, paddingLeft: px, paddingRight: px,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, transition: "color 0.15s",
    }}>
      {children}
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDuration(str: string): number {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Animation variants ────────────────────────────────────────────────────────

const infoContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const infoLine: Variants = {
  hidden: { opacity: 0, y: 5 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.22, 1.06, 0.36, 1] } },
  exit:   { opacity: 0, y: -2, transition: { duration: 0.20, ease: [0.4, 0, 0.7, 1] } },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlbumPlayer() {
  const [idx,      setIdx]      = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const [queueOpen, setQueueOpen]  = useState(false);
  const [volMode,    setVolMode]    = useState(0); // 0=full 1=low 2=mute
  const [liked,      setLiked]      = useState(false);
  const [shuffled,   setShuffled]   = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0=off 1=all 2=once
  const [hoverL,   setHoverL]   = useState(false);
  const [hoverR,   setHoverR]   = useState(false);
  const [progress, setProgress] = useState(0);

  const play  = useMorphSvg(PLAY);
  const vol   = useMorphSvg(VOLUME);
  const eq    = useMorphSvg(QUEUE);
  const mode  = useMorphSvg(SHUFFLE);
  const rep   = useMorphSvg(REPEAT);
  const heart = useMorphSvg(PLUS);
  const chevL = useMorphSvg(CHEV_L1);
  const chevR = useMorphSvg(CHEV_R1);
  const skipB = useMorphSvg(SKIP_BACK);
  const skipF = useMorphSvg(SKIP_FWD);
  const scrubRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ELEGANT   = { stiffness: 500, damping: 30, mass: 1.12 };
  const PLAY_MORPH = { stiffness: 500, damping: 30, mass: 1.12 };

  const album = ALBUMS[idx];
  const totalSec = parseDuration(album.total);

  // Reset progress on track change
  useEffect(() => { setProgress(0); }, [idx]);

  // Advance progress while playing
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 1 / (totalSec * 10);
        return next >= 1 ? 1 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, totalSec]);

  // Auto-advance when track ends
  useEffect(() => {
    if (progress >= 1) {
      const t = setTimeout(() => {
        setIdx(i => (i + 1) % ALBUMS.length);
        setProgress(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [progress]);

  const togglePlay  = () => { const n = !playing;    setPlaying(n);    play.to(n ? PAUSE : PLAY, PLAY_MORPH); };
  const toggleQueue = () => { const n = !queueOpen;  setQueueOpen(n);  eq.to(n ? WAVEFORM : QUEUE, ELEGANT); };
  const cycleVolume = () => {
    const n = (volMode + 1) % 3;
    setVolMode(n);
    if (n === 0) vol.to(VOLUME, ELEGANT);
    if (n === 1) vol.to(VOLUME_LOW, ELEGANT);
    if (n === 2) vol.to(VOLUME_MUTE, ELEGANT);
  };
  const cycleRepeat = () => {
    const n = (repeatMode + 1) % 3;
    setRepeatMode(n);
    if (n === 1) rep.to(REPEAT, ELEGANT);
    if (n === 2) rep.to(REPEAT_ONCE, ELEGANT);
    if (n === 0) rep.to(REPEAT, ELEGANT);
  };
  const toggleLike    = () => { const n = !liked;    setLiked(n);    heart.to(n ? CHECK : PLUS, ELEGANT); };
  const toggleShuffle = () => { const n = !shuffled; setShuffled(n); mode.to(n ? ARROWS_CLOCKWISE : SHUFFLE, ELEGANT); };

  const prev = () => setIdx(i => (i - 1 + ALBUMS.length) % ALBUMS.length);
  const next = () => setIdx(i => (i + 1) % ALBUMS.length);

  const startScrubBack = () => {
    skipB.to(REWIND, ELEGANT);
    scrubRef.current = setInterval(() => setProgress(p => Math.max(0, p - 0.008)), 100);
  };
  const startScrubFwd = () => {
    skipF.to(FAST_FWD, ELEGANT);
    scrubRef.current = setInterval(() => setProgress(p => Math.min(1, p + 0.008)), 100);
  };
  const stopScrubBack = () => {
    if (scrubRef.current) { clearInterval(scrubRef.current); scrubRef.current = null; }
    skipB.to(SKIP_BACK, ELEGANT);
  };
  const stopScrubFwd = () => {
    if (scrubRef.current) { clearInterval(scrubRef.current); scrubRef.current = null; }
    skipF.to(SKIP_FWD, ELEGANT);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F7F3EC",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Chevrons flank a single column that contains both the card and controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>

        <button
          onMouseEnter={() => { setHoverL(true);  chevL.to(CHEV_L2, ELEGANT); }}
          onMouseLeave={() => { setHoverL(false); chevL.to(CHEV_L1, ELEGANT); }}
          onClick={prev}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", color: hoverL ? "#1A1714" : "#787470", transition: "color 0.15s" }}
        >
          <svg ref={chevL.ref} viewBox="0 0 256 256" width={20} height={20} />
        </button>

        {/* Center column — card + controls share the same width */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Album art */}
          <div style={{
            width: SIZE, height: SIZE, borderRadius: 20, flexShrink: 0,
            position: "relative",
            boxShadow: [
              "0 1px 3px rgba(142,142,147,0.24)",
              "0 4px 8px rgba(142,142,147,0.22)",
              "0 10px 20px rgba(142,142,147,0.20)",
              "0 20px 36px rgba(142,142,147,0.18)",
            ].join(", "),
          }}>
            <AnimatePresence>
              <motion.img
                key={idx}
                src={album.image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 20 }}
              />
            </AnimatePresence>
            <div style={{
              position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
              boxShadow: [
                "inset 0 1px 0 rgba(255,255,255,1.0)",              // top hairline — pure white
                "inset 0 1px 5px rgba(255,255,255,0.60)",           // tight top glow
                "inset 0 3px 18px -4px rgba(255,255,255,0.18)",     // soft ambient falloff
                "inset 1px 0 0 rgba(255,255,255,0.55)",             // left edge hairline
                "inset -1px 0 0 rgba(255,255,255,0.55)",            // right edge hairline
                "inset 1.5px 0 6px -3px rgba(255,255,255,0.14)",    // left corner wrap
                "inset -1.5px 0 6px -3px rgba(255,255,255,0.14)",   // right corner wrap
                "inset 0 -1px 0 rgba(0,0,0,0.42)",                  // bottom shadow line
              ].join(", "),
            }} />
          </div>

          {/* Controls — same width as card, left/right edges guaranteed to match */}
          <div style={{ width: SIZE, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Track info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    variants={infoContainer}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                  >
                    <motion.div variants={infoLine} style={{ fontFamily: SANS, fontWeight: 400, fontSize: 20, color: "#1A1714", letterSpacing: "-0.01em", lineHeight: "20px" }}>
                      {album.song}
                    </motion.div>
                    <motion.div variants={infoLine} style={{ fontFamily: SANS, fontSize: 12, color: "#787470", marginTop: 10, lineHeight: "16px" }}>
                      {album.artist}
                    </motion.div>
                    <motion.div variants={infoLine} style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#787470", marginTop: 2, lineHeight: "12px" }}>
                      {album.title} · {album.year}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <motion.button
                onClick={toggleLike}
                animate={{
                  backgroundColor: liked ? "#1A1714" : "rgba(0,0,0,0)",
                  borderColor: liked ? "#1A1714" : "#787470",
                }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ width: 30, height: 30, borderRadius: "50%", borderWidth: 1.5, borderStyle: "solid", borderColor: "#787470", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: liked ? "#FAF6EE" : "#787470", transition: "color 0.22s", boxSizing: "border-box" }}
              >
                <svg ref={heart.ref} viewBox="0 0 256 256" width={13} height={13} />
              </motion.button>
            </div>

            {/* Progress */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
              <div style={{ height: 1.5, background: "#787470", borderRadius: 1, position: "relative" }}>
                <div style={{ width: `${progress * 100}%`, height: "100%", background: "#1A1714", borderRadius: 1 }} />
                <div style={{
                  position: "absolute", top: "50%", left: `${progress * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: 7, height: 7, borderRadius: "50%", background: "#1A1714",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.08em", color: "#787470", fontVariantNumeric: "tabular-nums" }}>
                  {formatTime(Math.floor(progress * totalSec))}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.08em", color: "#787470", fontVariantNumeric: "tabular-nums" }}>
                  {album.total}
                </span>
              </div>
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Btn onClick={toggleQueue} color={queueOpen ? "#1A1714" : "#787470"} px={0}>
                <svg ref={eq.ref} viewBox="0 0 256 256" width={15} height={15} />
              </Btn>
              <Btn onClick={toggleShuffle} color={shuffled ? "#1A1714" : "#787470"}>
                <svg ref={mode.ref} viewBox="0 0 256 256" width={15} height={15} />
              </Btn>
              <Btn onMouseDown={startScrubBack} onMouseUp={stopScrubBack} onMouseLeave={stopScrubBack}>
                <svg ref={skipB.ref} viewBox="0 0 256 256" width={17} height={17} />
              </Btn>
              <motion.button
                onClick={togglePlay}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, mass: 1.2 }}
                style={{ width: 52, height: 52, borderRadius: "50%", background: "#1A1714", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <svg ref={play.ref} viewBox="0 0 256 256" width={17} height={17} style={{ color: "#FAF6EE" }} />
              </motion.button>
              <Btn onMouseDown={startScrubFwd} onMouseUp={stopScrubFwd} onMouseLeave={stopScrubFwd}>
                <svg ref={skipF.ref} viewBox="0 0 256 256" width={17} height={17} />
              </Btn>
              <Btn onClick={cycleRepeat} color={repeatMode === 0 ? "#787470" : "#1A1714"}>
                <svg ref={rep.ref} viewBox="0 0 256 256" width={15} height={15} />
              </Btn>
              <Btn onClick={cycleVolume} color={volMode === 2 ? "#787470" : "#1A1714"} px={0}>
                <svg ref={vol.ref} viewBox="0 0 256 256" width={15} height={15} />
              </Btn>
            </div>
          </div>

        </div>

        <button
          onMouseEnter={() => { setHoverR(true);  chevR.to(CHEV_R2, ELEGANT); }}
          onMouseLeave={() => { setHoverR(false); chevR.to(CHEV_R1, ELEGANT); }}
          onClick={next}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", color: hoverR ? "#1A1714" : "#787470", transition: "color 0.15s" }}
        >
          <svg ref={chevR.ref} viewBox="0 0 256 256" width={20} height={20} />
        </button>

      </div>

      <div style={{ position: "fixed", top: 20, right: 24, fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6359", lineHeight: 1.7, textAlign: "right" }}>
        getruun — 0.1.0<br /><span style={{ opacity: 0.5 }}>Spring SVG Morph</span>
      </div>
    </div>
  );
}
