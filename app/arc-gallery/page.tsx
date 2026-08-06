"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

const MONO = "var(--font-mdui), monospace";
const SANS = "var(--font-geist-sans), sans-serif";

type Plate = { src: string; title: string; year: string };

const PLATES: Plate[] = [
  { src: "/card-shelf/shoegaze_street_lavender_blue.png", title: "Lavender Blue", year: "1998" },
  { src: "/card-shelf/shoegaze_coral_crossing.png",       title: "Coral Crossing", year: "1994" },
  { src: "/card-shelf/gaze-1.png",                        title: "Nightfield",     year: "2001" },
  { src: "/card-shelf/shoegaze_lavender_fog.png",         title: "Lavender Fog",   year: "1991" },
  { src: "/card-shelf/shoegaze_magenta_rain.png",         title: "Magenta Rain",   year: "1996" },
  { src: "/card-shelf/shoegaze_street_butter_gold.png",   title: "Butter Gold",    year: "1989" },
  { src: "/card-shelf/shoegaze_teal_reflection.png",      title: "Teal Reflection", year: "2003" },
  { src: "/card-shelf/shoegaze_street_peach_coral.png",   title: "Peach Coral",    year: "1993" },
  { src: "/card-shelf/shoegaze_street_seafoam_mint.png",  title: "Seafoam Mint",   year: "1999" },
];

const CARD_W = 208;
const CARD_H = 286;
const SPACING = 104; // < CARD_W, so plates overlap
const DROP = 30; // parabola depth per unit offset²
const SCALE_FALLOFF = 0.085;

function Plate({
  plate,
  index,
  center,
  hovered,
  anyHovered,
  onHover,
}: {
  plate: Plate;
  index: number;
  center: MotionValue<number>;
  hovered: boolean;
  anyHovered: boolean;
  onHover: (i: number | null) => void;
}) {
  const offset = useTransform(center, (c) => index - c);

  const x = useTransform(offset, (o) => o * SPACING);
  const y = useTransform(offset, (o) => o * o * DROP);
  const scale = useTransform(offset, (o) => Math.max(0.52, 1 - Math.abs(o) * SCALE_FALLOFF));
  const zIndex = useTransform(offset, (o) => 100 - Math.round(Math.abs(o) * 10));
  const depth = useTransform(offset, (o) => Math.max(0, 1 - Math.abs(o) * 0.07));

  return (
    <motion.div
      onHoverStart={() => onHover(index)}
      onHoverEnd={() => onHover(null)}
      style={{
        position: "absolute",
        width: CARD_W,
        height: CARD_H,
        x,
        y,
        zIndex,
        transformOrigin: "center bottom",
        cursor: "default",
      }}
    >
      <motion.div
        style={{ width: "100%", height: "100%", scale, originY: 1 }}
        animate={{ y: hovered ? -18 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <motion.div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: 4,
            background: "#1A1714",
            opacity: depth,
            boxShadow: "0 18px 40px rgba(26,23,20,0.16)",
          }}
          animate={{ filter: anyHovered && !hovered ? "saturate(0.45)" : "saturate(1)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={plate.src}
            alt={plate.title}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </motion.div>

        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6B6359",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {plate.title} · {plate.year}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function ArcGallery() {
  const mid = (PLATES.length - 1) / 2;
  const target = useMotionValue(mid);
  const center = useSpring(target, { stiffness: 90, damping: 22, mass: 0.9 });
  const [hovered, setHovered] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Pointer x traverses the arc; the spring keeps the travel interruptible.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const t = e.clientX / window.innerWidth;
      const travel = 2.2; // plates the pointer can pull past center in each direction
      target.set(mid + (t - 0.5) * 2 * travel);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mid, target]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4EFE6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <nav
        style={{
          position: "relative",
          zIndex: 200,
          display: "flex",
          gap: 22,
          marginBottom: 48,
          fontFamily: SANS,
          fontSize: 13.5,
          letterSpacing: "-0.01em",
          color: "#1A1714",
        }}
      >
        <span style={{ fontWeight: 500 }}>Street Archive™</span>
        {["Works", "Plates", "Index", "Contact"].map((item) => (
          <motion.a
            key={item}
            href="#"
            onClick={(e) => e.preventDefault()}
            whileHover={{ opacity: 1 }}
            initial={{ opacity: 0.62 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ color: "#1A1714", textDecoration: "none" }}
          >
            {item}
          </motion.a>
        ))}
      </nav>

      <div
        ref={stageRef}
        style={{
          position: "relative",
          width: "100%",
          height: CARD_H + 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {PLATES.map((plate, i) => (
          <Plate
            key={plate.src}
            plate={plate}
            index={i}
            center={center}
            hovered={hovered === i}
            anyHovered={hovered !== null}
            onHover={setHovered}
          />
        ))}
      </div>

      <div
        style={{
          position: "fixed",
          top: 20,
          right: 24,
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#6B6359",
          lineHeight: 1.7,
          textAlign: "right",
        }}
      >
        Effect.3
        <br />
        <span style={{ opacity: 0.5 }}>Move to traverse the arc</span>
      </div>
    </div>
  );
}
