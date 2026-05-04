"use client";

import Image from "next/image";
import LabCanvas from "@/components/LabCanvas";
import { motion } from "framer-motion";
import { useState } from "react";

const CARDS = [
  {
    id: 0,
    image: "/live-polish/braun-red.png",
    brand: "Braun · 1972",
    title: "KF 20 Aromaster",
    price: "$320",
    swatch: "#d42018",
    glow: "radial-gradient(ellipse at 50% 20%, rgba(212,32,24,0.85) 0%, rgba(200,20,12,0.6) 30%, rgba(160,0,0,0.1) 45%, transparent 60%)",
  },
  {
    id: 1,
    image: "/live-polish/braun-yellow.png",
    brand: "Braun · 1972",
    title: "KF 20 Aromaster",
    price: "$320",
    swatch: "#c8820c",
    glow: "radial-gradient(ellipse at 50% 20%, rgba(200,130,12,0.85) 0%, rgba(180,105,8,0.6) 30%, rgba(140,75,0,0.1) 45%, transparent 60%)",
  },
  {
    id: 2,
    image: "/live-polish/braun-green.png",
    brand: "Braun · 1972",
    title: "KF 20 Aromaster",
    price: "$320",
    swatch: "#6ab820",
    glow: "radial-gradient(ellipse at 50% 20%, rgba(106,184,32,0.85) 0%, rgba(80,150,20,0.6) 30%, rgba(50,110,10,0.1) 45%, transparent 60%)",
  },
];

const STACK = [
  { rotate: 0,  y: 0, x: 0  },
  { rotate: -7, y: 3, x: -8 },
  { rotate: 7,  y: 3, x: 8  },
];

const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;
const DRAG_SPRING = { type: "spring", stiffness: 500, damping: 28 } as const;

const SHADOWS = [
  "0 24px 48px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.35)",
  "0 10px 20px rgba(0,0,0,0.3),  0 4px 8px rgba(0,0,0,0.2)",
  "0 4px 8px rgba(0,0,0,0.18),   0 2px 4px rgba(0,0,0,0.12)",
];

export default function LivePolish() {
  const [activeIndex, setActiveIndex] = useState(0);

  const order = CARDS.map((_, i) => (activeIndex + i) % CARDS.length);

  function goNext() { setActiveIndex(prev => (prev + 1) % CARDS.length); }
  function goPrev() { setActiveIndex(prev => (prev - 1 + CARDS.length) % CARDS.length); }

  return (
    <>
      <LabCanvas bg="#0a0a0a">
        <div style={{ position: "relative" }}>

          {/* Glow */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "-10%",
              left: "50%",
              translateX: "-50%",
              width: 700,
              height: 700,
              filter: "blur(50px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {CARDS.map(card => (
              <motion.div
                key={card.id}
                animate={{ opacity: order[0] === card.id ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: "50%",
                  background: card.glow,
                }}
              />
            ))}
          </motion.div>

          {/* Card stack */}
          <div style={{ position: "relative", zIndex: 1, display: "grid" }}>
            {[...order].reverse().map((cardId) => {
              const stackPos = order.indexOf(cardId);
              const isActive = stackPos === 0;
              const card = CARDS[cardId];
              const pos = STACK[stackPos];

              return (
                <motion.div
                  key={cardId}
                  animate={{ x: pos.x, y: pos.y, rotate: pos.rotate, boxShadow: SHADOWS[stackPos] }}
                  transition={SPRING}
                  drag={isActive ? "x" : false}
                  dragTransition={DRAG_SPRING}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) {
                      info.offset.x < 0 ? goNext() : goPrev();
                    }
                  }}
                  onClick={() => !isActive && (stackPos === 1 ? goNext() : goPrev())}
                  style={{
                    gridArea: "1 / 1",
                    position: "relative",
                    zIndex: 30 - stackPos * 10,
                    width: 300,
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: isActive ? "grab" : "pointer",
                    userSelect: "none",
                    transformOrigin: "bottom center",
                  }}
                >
                  {/* Heart */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={e => e.stopPropagation()}
                    style={{ position: "absolute", top: 12, right: 12, zIndex: 20, cursor: "pointer", lineHeight: 0 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path fill="none" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>

                  {/* Image */}
                  <div style={{ height: 240, position: "relative", overflow: "hidden" }}>
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      style={{ objectFit: "cover", objectPosition: "center center", transform: "scale(1.2)", transformOrigin: "center center" }}
                      priority={isActive}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <p style={{ fontSize: 8, fontWeight: 700, color: "#999", margin: 0, fontFamily: "var(--font-geist-mono)" }}>{card.brand}</p>
                      <h2 style={{ fontSize: 20, fontWeight: 400, color: "#111", margin: 0, fontFamily: "'Inter', sans-serif" }}>{card.title}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 400, color: "#111", fontFamily: "var(--font-geist-mono)" }}>{card.price}</span>
                        <span style={{ color: "#bbb", fontSize: 14 }}>|</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {CARDS.map(c => (
                            <div
                              key={c.id}
                              onClick={e => { e.stopPropagation(); setActiveIndex(c.id); }}
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: c.swatch,
                                flexShrink: 0,
                                cursor: "pointer",
                                boxShadow: order[0] === c.id
                                  ? "0 0 0 2px #fff, 0 0 0 3.5px #111"
                                  : "none",
                                transition: "box-shadow 0.15s ease",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, padding: "9px 0", borderRadius: 100, background: "#D3D3D3", border: "1px solid #ddd", color: "#111", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        Add to bag
                      </button>
                      <button
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, padding: "9px 0", borderRadius: 100, background: "#111", border: "none", color: "#fff", fontSize: 12, cursor: "pointer" }}
                      >
                        Buy now
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </LabCanvas>
    </>
  );
}
