"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import fontData from "./fonts.json";
import gsap from "gsap";
import { LabCanvas } from "@/components";

type Font = {
  id: number;
  name: string;
  family: string;
  x: number;
  y: number;
};

export default function SpatialFilter() {
  // ============================================
  // STATE & REFS
  // ============================================

  // Circle position as percentage of canvas (0-100)
  const [circlePos, setCirclePos] = useState({ x: 50, y: 50 });

  // Velocity for blur effect on the font list (0-1 normalized)
  const [velocity, setVelocity] = useState(0);

  // DOM refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  // Refs for each dot element - keyed by font id for GSAP targeting
  const dotRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Track which dots are currently being influenced by the circle
  // Used to detect when a dot exits the influence zone and should spring back
  const influencedDots = useRef<Set<number>>(new Set());

  // For velocity calculation between frames
  const prevPositionRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const timeStampRef = useRef<number>(0);

  // Track dragging state for glow effect
  const [isDragging, setIsDragging] = useState(false);

  // ============================================
  // CONSTANTS
  // ============================================

  // Selection radius - dots within this distance are "selected"
  const circleRadiusPercent = 8;

  // Influence radius - dots within this distance are attracted to the circle
  const influenceRadius = 20;

  // Light radius - dots within this distance are illuminated (larger = softer falloff)
  const lightRadius = 35;

  // ============================================
  // DERIVED DATA
  // ============================================

  // Calculate distance from a font to the circle center
  const getDistance = (font: Font) => {
    const xPos = font.x - circlePos.x;
    const yPos = font.y - circlePos.y;

    return Math.sqrt(xPos * xPos + yPos * yPos);
  };

  // Fonts currently inside the selection circle, sorted by distance
  const filteredFonts = fontData
    .filter((font) => getDistance(font) <= circleRadiusPercent)
    .sort((a, b) => getDistance(a) - getDistance(b));


  // ============================================
  // DRAG HANDLERS
  // ============================================

  const handleDragStart = () => {
    timeStampRef.current = 0;
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setVelocity(0);
    setIsDragging(false);
  };

  const handleDrag = () => {
    const canvas = canvasRef.current;
    const circle = circleRef.current;
    if (!canvas || !circle) return;

    // Get positions
    const canvasRect = canvas.getBoundingClientRect();
    const circleRect = circle.getBoundingClientRect();
    const circleCenterX = circleRect.left + circleRect.width / 2;
    const circleCenterY = circleRect.top + circleRect.height / 2;

    // Convert to percentage within canvas
    const percentX = ((circleCenterX - canvasRect.left) / canvasRect.width) * 100;
    const percentY = ((circleCenterY - canvasRect.top) / canvasRect.height) * 100;

    setCirclePos({ x: percentX, y: percentY });

    // ----------------------------------------
    // Velocity calculation for font list blur
    // ----------------------------------------
    const now = performance.now();
    const time = now - timeStampRef.current;

    // Skip on first frame or if time delta is too small
    if (timeStampRef.current === 0 || time < 1) {
      timeStampRef.current = now;
      prevPositionRef.current = { x: percentX, y: percentY };
      return;
    }

    const dx = percentX - prevPositionRef.current.x;
    const dy = percentY - prevPositionRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Treat tiny movements as zero velocity
    const rawVelocity = distance < 0.1 ? 0 : distance / time;
    const normalizedVelocity = Math.min(rawVelocity * 3, 1);

    // Smooth velocity with asymmetric response:
    // - Fast ramp up (responsive to movement)
    // - Slow decay (prevents flickering)
    if (Number.isFinite(normalizedVelocity)) {
      setVelocity((prev) => {
        if (normalizedVelocity > prev) {
          return prev + (normalizedVelocity - prev) * 0.15;
        } else {
          return prev + (normalizedVelocity - prev) * 0.02;
        }
      });
    }

    prevPositionRef.current = { x: percentX, y: percentY };
    timeStampRef.current = now;

    // ----------------------------------------
    // Dot attraction animation with collision
    // ----------------------------------------

    // First pass: calculate target positions for all influenced dots
    const dotPositions: { id: number; targetX: number; targetY: number; baseX: number; baseY: number }[] = [];

    fontData.forEach((font) => {
      const xPos = font.x - percentX;
      const yPos = font.y - percentY;
      const distance = Math.sqrt(xPos * xPos + yPos * yPos);

      if (distance < influenceRadius && distance > 0) {
        const proximity = 1 - distance / influenceRadius;
        const offsetX = -xPos * proximity * 2;
        const offsetY = -yPos * proximity * 2;

        dotPositions.push({
          id: font.id,
          targetX: font.x + offsetX,
          targetY: font.y + offsetY,
          baseX: font.x,
          baseY: font.y,
        });
      }
    });

    // Second pass: apply collision repulsion between dots
    const collisionRadius = 3; // Minimum distance between dots (in %)
    const repulsionStrength = 1.5;

    for (let i = 0; i < dotPositions.length; i++) {
      for (let j = i + 1; j < dotPositions.length; j++) {
        const dotA = dotPositions[i];
        const dotB = dotPositions[j];

        const dx = dotA.targetX - dotB.targetX;
        const dy = dotA.targetY - dotB.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < collisionRadius && dist > 0) {
          // Calculate repulsion force
          const overlap = collisionRadius - dist;
          const normalX = dx / dist;
          const normalY = dy / dist;

          // Push dots apart
          const pushX = normalX * overlap * repulsionStrength * 0.5;
          const pushY = normalY * overlap * repulsionStrength * 0.5;

          dotA.targetX += pushX;
          dotA.targetY += pushY;
          dotB.targetX -= pushX;
          dotB.targetY -= pushY;
        }
      }
    }

    // Third pass: animate dots to their final positions
    fontData.forEach((font) => {
      const xPos = font.x - percentX;
      const yPos = font.y - percentY;
      const dot = dotRefs.current[font.id];
      const distance = Math.sqrt(xPos * xPos + yPos * yPos);

      if (distance < influenceRadius && distance > 0) {
        const dotPos = dotPositions.find((d) => d.id === font.id);
        if (!dotPos) return;

        // Convert back to offset from original position
        const finalOffsetX = dotPos.targetX - font.x;
        const finalOffsetY = dotPos.targetY - font.y;

        gsap.to(dot, {
          x: finalOffsetX,
          y: finalOffsetY,
          duration: 0.15,
          ease: "power3.out",
          overwrite: true,
        });

        influencedDots.current.add(font.id);
      } else if (influencedDots.current.has(font.id)) {
        influencedDots.current.delete(font.id);

        // Spring back with more recoil bounce
        gsap.to(dot, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1.2, 0.3)",
          overwrite: true,
        });
      }
    });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <LabCanvas bg="linear-gradient(to bottom, #030304 0%, #030304 55%, #050507 85%, #070709 100%)">
      <style>{`
        @keyframes sway {
          0%, 100% { transform: translate(0px, 0px); }
          25% { transform: translate(1.5px, -1px); }
          50% { transform: translate(-0.5px, 1.5px); }
          75% { transform: translate(-1px, -0.5px); }
        }
      `}</style>
      <div className="flex flex-col items-start gap-3">
        {/* Label - top left */}
        <div className="flex flex-row items-center gap-2 text-white/40">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="3" width="12" height="18" rx="6" />
            <line x1="12" y1="7" x2="12" y2="11" />
          </svg>
          <span className="text-[10px] tracking-wide">
            Drag to select fonts
          </span>
        </div>

        <div
          className="flex flex-row gap-3 items-center justify-center p-4 rounded-xl"
          style={{
            background: "linear-gradient(to bottom, #121215 0%, #0a0a0d 40%, #050507 100%)",
            boxShadow: "inset 1px 0 0 rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.04), inset -1px -1px 0 rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 4px transparent, 0 0 0 5px rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.04)",
          }}
        >
          {/* Main canvas section */}
          <div className="flex flex-col items-center gap-1">
            {/* Y-axis label - top */}
            <span
              className="text-[10px] transition-all duration-200"
              style={{
                color: `rgba(255, 255, 255, ${0.2 + Math.max(0, 1 - circlePos.y / 25) * 0.6})`,
                textShadow: circlePos.y < 25
                  ? `0 0 ${8 * (1 - circlePos.y / 25)}px rgba(255, 255, 255, ${0.5 * (1 - circlePos.y / 25)}), 0 0 ${16 * (1 - circlePos.y / 25)}px rgba(220, 225, 255, ${0.3 * (1 - circlePos.y / 25)})`
                  : 'none',
              }}
            >Geometric</span>

          <div className="flex items-center gap-1">
            {/* X-axis label - left */}
            <span
              className="text-[10px] -rotate-90 w-3 transition-all duration-200"
              style={{
                color: `rgba(255, 255, 255, ${0.2 + Math.max(0, 1 - circlePos.x / 25) * 0.6})`,
                textShadow: circlePos.x < 25
                  ? `0 0 ${8 * (1 - circlePos.x / 25)}px rgba(255, 255, 255, ${0.5 * (1 - circlePos.x / 25)}), 0 0 ${16 * (1 - circlePos.x / 25)}px rgba(220, 225, 255, ${0.3 * (1 - circlePos.x / 25)})`
                  : 'none',
              }}
            >Thin</span>

            {/* Canvas - fixed size that fits within LabCanvas */}
            <div
              ref={canvasRef}
              className="relative flex h-[220px] w-[220px] rounded-[8px]"
              style={{
                backgroundColor: "rgba(5, 7, 9, 0.07)",
                border: "2px solid rgba(45, 45, 45, 0.90)",
              }}
            >
              {/* Draggable circle */}
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={canvasRef}
                dragTransition={{ power: 0.9, timeConstant: 900 }}
                dragElastic={0}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                ref={circleRef}
                className="absolute z-40 cursor-pointer h-[50px] w-[50px] rounded-full border border-white/40 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: "50%",
                  top: "50%",
                  background: "rgba(255, 255, 255, 0.09)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(1px)",
                }}
                animate={{
                  boxShadow: isDragging
                    ? "0 0 6px 1px rgba(255, 255, 255, 0.06), 0 0 12px 2px rgba(255, 255, 255, 0.03), inset 0 0 4px rgba(255, 255, 255, 0.05)"
                    : [
                        "0 0 8px 1px rgba(255, 255, 255, 0.06), 0 0 14px 2px rgba(255, 255, 255, 0.03), inset 0 0 4px rgba(255, 255, 255, 0.05)",
                        "0 0 12px 2px rgba(255, 255, 255, 0.1), 0 0 20px 4px rgba(255, 255, 255, 0.05), inset 0 0 6px rgba(255, 255, 255, 0.08)",
                        "0 0 8px 1px rgba(255, 255, 255, 0.06), 0 0 14px 2px rgba(255, 255, 255, 0.03), inset 0 0 4px rgba(255, 255, 255, 0.05)",
                      ],
                }}
                transition={{
                  boxShadow: isDragging
                    ? { duration: 0.1, ease: "easeOut" }
                    : { duration: 3, repeat: Infinity, ease: "easeInOut" },
                }}
              />

              {/* Dots */}
              {fontData.map((font) => {
                const distance = getDistance(font);
                const isSelected = distance <= circleRadiusPercent;

                // Calculate illumination based on distance from light source
                const illumination = Math.max(0, 1 - distance / lightRadius);
                // Apply easing curve for more natural light falloff
                const brightness = illumination * illumination;
                // Minimum visibility so dots don't completely disappear
                const minBrightness = 0.08;
                const finalBrightness = minBrightness + brightness * (1 - minBrightness);

                // For selected dots: calculate intensity based on proximity to center
                // Closer to center = brighter orange glow
                const selectionIntensity = isSelected
                  ? Math.max(0, 1 - distance / circleRadiusPercent)
                  : 0;

                return (
                  <div
                    key={font.id}
                    ref={(el) => {
                      dotRefs.current[font.id] = el;
                    }}
                    className="absolute"
                    style={{
                      left: `${font.x}%`,
                      top: `${font.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div
                      className="rounded-full transition-[width,height,background-color,box-shadow] duration-150"
                      style={{
                        width: isSelected ? "8px" : "5px",
                        height: isSelected ? "8px" : "5px",
                        backgroundColor: isSelected
                          ? `rgba(${67 + selectionIntensity * 30}, ${84 + selectionIntensity * 30}, ${184 + selectionIntensity * 40}, ${0.8 + selectionIntensity * 0.2})`
                          : `rgba(255, 255, 255, ${finalBrightness * 0.6})`,
                        boxShadow: isSelected
                          ? `0 0 ${4 + selectionIntensity * 6}px ${1 + selectionIntensity * 2}px rgba(67, 84, 184, ${0.6 + selectionIntensity * 0.35}), 0 0 ${8 + selectionIntensity * 8}px rgba(67, 84, 184, ${0.15 + selectionIntensity * 0.15})`
                          : "none",
                        animationName: isSelected ? "sway" : "none",
                        animationDuration: isSelected ? `${2 + (font.id % 3) * 0.5}s` : "0s",
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        animationDelay: isSelected ? `${(font.id % 7) * 0.3}s` : "0s",
                      }}
                    />
                  </div>
                );
              })}

              {/* Darkness overlay - radial gradient following the circle */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[6px]"
                style={{
                  background: `radial-gradient(
                    circle at ${circlePos.x}% ${circlePos.y}%,
                    transparent 0%,
                    transparent 12%,
                    rgba(0, 0, 0, 0.15) 25%,
                    rgba(0, 0, 0, 0.35) 45%,
                    rgba(0, 0, 0, 0.5) 70%
                  )`,
                  transition: "background 0.05s ease-out",
                }}
              />

              {/* Crosshair lines */}
              <div
                className="absolute h-[1px] bg-white/30 pointer-events-none"
                style={{
                  left: 0,
                  top: `${circlePos.y}%`,
                  width: `${circlePos.x - 6.25}%`,
                }}
              />
              <div
                className="absolute h-[1px] bg-white/30 pointer-events-none"
                style={{
                  left: `${circlePos.x + 6.25}%`,
                  top: `${circlePos.y}%`,
                  width: `${100 - circlePos.x - 6.25}%`,
                }}
              />
              <div
                className="absolute w-[1px] bg-white/30 pointer-events-none"
                style={{
                  top: 0,
                  left: `${circlePos.x}%`,
                  height: `${circlePos.y - 6.25}%`,
                }}
              />
              <div
                className="absolute w-[1px] bg-white/30 pointer-events-none"
                style={{
                  top: `${circlePos.y + 6.25}%`,
                  left: `${circlePos.x}%`,
                  height: `${100 - circlePos.y - 6.25}%`,
                }}
              />
            </div>

            {/* X-axis label - right */}
            <span
              className="text-[10px] -rotate-90 w-3 transition-all duration-200"
              style={{
                color: `rgba(255, 255, 255, ${0.2 + Math.max(0, 1 - (100 - circlePos.x) / 25) * 0.6})`,
                textShadow: circlePos.x > 75
                  ? `0 0 ${8 * (1 - (100 - circlePos.x) / 25)}px rgba(255, 255, 255, ${0.5 * (1 - (100 - circlePos.x) / 25)}), 0 0 ${16 * (1 - (100 - circlePos.x) / 25)}px rgba(220, 225, 255, ${0.3 * (1 - (100 - circlePos.x) / 25)})`
                  : 'none',
              }}
            >Bold</span>
          </div>

          {/* Y-axis label - bottom */}
          <span
            className="text-[10px] transition-all duration-200"
            style={{
              color: `rgba(255, 255, 255, ${0.2 + Math.max(0, 1 - (100 - circlePos.y) / 25) * 0.6})`,
              textShadow: circlePos.y > 75
                ? `0 0 ${8 * (1 - (100 - circlePos.y) / 25)}px rgba(255, 255, 255, ${0.5 * (1 - (100 - circlePos.y) / 25)}), 0 0 ${16 * (1 - (100 - circlePos.y) / 25)}px rgba(220, 225, 255, ${0.3 * (1 - (100 - circlePos.y) / 25)})`
                : 'none',
            }}
          >Humanist</span>
        </div>

        {/* Font list sidebar */}
        <div className="flex flex-col justify-start items-start h-[220px] w-[100px] gap-2 pl-3">
          {/* Font count */}
          <span className="text-white/40 text-[10px] px-2">
            {filteredFonts.length} {filteredFonts.length === 1 ? "font" : "fonts"}
          </span>
          <ul
            className="font-list flex flex-col justify-start items-start h-full w-full gap-1 overflow-y-auto overflow-x-hidden pr-1"
            style={{
              opacity: velocity > 0.3 ? 1 - velocity * 0.9 : 1,
              filter: velocity > 0.3 ? `blur(${velocity * 18}px)` : "none",
              transition: "opacity 0.15s ease-out, filter 0.15s ease-out",
            }}
          >
            {filteredFonts.length === 0 ? (
                <li className="flex flex-col items-center justify-center h-full w-full text-white/30 text-[10px] text-center gap-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-50"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l2 2" />
                  </svg>
                  <span>Move to discover</span>
                </li>
              ) : (
                filteredFonts.map((font) => (
                    <li
                      key={font.id}
                      className="w-full px-2 py-1.5 cursor-pointer group"
                    >
                      <span
                        style={{ fontFamily: font.family }}
                        className="text-white/70 text-xs w-full block truncate transition-all duration-150 group-hover:text-white group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.5),0_0_12px_rgba(220,225,255,0.3)]"
                      >
                        {font.name}
                      </span>
                    </li>
                  ))
              )}
          </ul>
        </div>
        </div>
      </div>
    </LabCanvas>
  );
}
