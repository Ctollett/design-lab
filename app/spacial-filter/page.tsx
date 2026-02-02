"use client";

import { useState, useRef } from "react";
import { motion, percent } from "framer-motion";
import fontData from "./fonts.json";
import gsap from "gsap";


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

  // ============================================
  // CONSTANTS
  // ============================================

  // Selection radius - dots within this distance are "selected"
  const circleRadiusPercent = 5;

  // Influence radius - dots within this distance are attracted to the circle
  const influenceRadius = 15;

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
  };

  const handleDragEnd = () => {
    setVelocity(0);
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
    // Dot attraction animation
    // TODO: Implement GSAP animation here
    // ----------------------------------------
    fontData.forEach((font) => {
      const xPos = font.x - percentX;
      const yPos = font.y - percentY;
      const dot = dotRefs.current[font.id]
      const distance = Math.sqrt(xPos * xPos + yPos * yPos)
      const proximity = 1 - (distance / influenceRadius);
const offsetX = -xPos * proximity * 2;
const offsetY = -yPos * proximity * 2;


      if (distance < influenceRadius && distance > 0) {
        gsap.to(dot, {
          x: offsetX,
          y: offsetY,
          duration: 0.25,
          ease: "power2.out",
          overwrite: true,
        });

        influencedDots.current.add(font.id);
      } else if (influencedDots.current.has(font.id)) {
          influencedDots.current.delete(font.id) 
           gsap.to(dot, {
  x: 0,
  y: 0,
  duration: 0.5 + Math.random() * 0.4,  // 0.5 to 0.8 seconds
  ease: `elastic.out(2, ${0.25 + Math.random() * 0.1})`,  // damping 0.25 to 0.4
})

          
        }


    })


  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-screen h-screen flex items-center justify-center overflow-hidden">
      <div className="transform scale-[0.5] origin-center flex flex-row gap-8 items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4">
        {/* Y-axis label - top */}
        <span className="text-white/20 text-sm">Geometric</span>

        <div className="flex items-center gap-4">
          {/* X-axis label - left */}
          <span className="text-white/20 text-sm -rotate-90 w-4">Thin</span>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative flex h-[40rem] w-[40rem] rounded-[12px]"
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
              className="absolute z-40 cursor-pointer h-20 w-20 rounded-full border-2 border-white bg-white/20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: "50%", top: "50%" }}
            />

            {/* Dots */}
            {fontData.map((font) => {
              const distance = getDistance(font);
              const isSelected = distance <= circleRadiusPercent;

              return (
                <div
                  key={font.id}
                  ref={(el) => {
                    dotRefs.current[font.id] = el;
                  }}
                  className="absolute rounded-full"
                  style={{
                    left: `${font.x}%`,
                    top: `${font.y}%`,
                    width: isSelected ? "12px" : "8px",
                    height: isSelected ? "12px" : "8px",
                    backgroundColor: isSelected ? "white" : "rgba(255,255,255,0.5)",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}

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
          <span className="text-white/20 text-sm -rotate-90 w-4">Bold</span>
        </div>

        {/* Y-axis label - bottom */}
        <span className="text-white/20 text-sm">Humanist</span>
      </div>

      {/* Font list sidebar */}
      <div className="flex justify-start items-start h-[40rem] w-[10rem]">
        <ul
          className="flex flex-col justify-start items-start h-[20rem] w-[10rem] gap-4"
          style={{
            // Blur effect based on drag velocity
            opacity: velocity > 0.3 ? 1 - velocity * 0.9 : 1,
            filter: velocity > 0.3 ? `blur(${velocity * 18}px)` : "none",
            transition: "opacity 0.15s ease-out, filter 0.15s ease-out",
          }}
        >
          {filteredFonts.map((font) => (
            <motion.li
              key={font.id}
              initial={{ opacity: 0, y: 2, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              className="w-[200px] rounded-lg border-1 border-zinc-900 p-4"
            >
              <span
                style={{ fontFamily: font.family }}
                className="text-white text-lg w-full"
              >
                {font.name}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}
