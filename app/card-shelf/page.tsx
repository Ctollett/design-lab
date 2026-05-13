"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { themes } from "@/lib/themes";
import { animate, motionValue } from "framer-motion";
import type * as THREE from "three";

const theme = { ...themes.linen, bg: "#f8f5f0" };

const CARDS = [
  { src: "/card-shelf/shoegaze_street_lavender_blue.png",  location: "Shimokitazawa",  city: "Tokyo",    year: "2001" },
  { src: "/card-shelf/shoegaze_street_seafoam_mint.png",   location: "Shoreditch",     city: "London",   year: "1998" },
  { src: "/card-shelf/shoegaze_street_peach_coral.png",    location: "Lower East Side", city: "New York", year: "2003" },
  { src: "/card-shelf/shoegaze_street_butter_gold.png",    location: "Belleville",     city: "Paris",    year: "1999" },
  { src: "/card-shelf/shoegaze_magenta_rain.png",          location: "Rue de Rivoli",  city: "Paris",    year: "1997" },
  { src: "/card-shelf/shoegaze_teal_reflection.png",       location: "Nishi-Shinjuku", city: "Tokyo",    year: "2000" },
  { src: "/card-shelf/shoegaze_lavender_fog.png",          location: "Kurfürstendamm", city: "Berlin",   year: "1996" },
  { src: "/card-shelf/shoegaze_coral_crossing.png",        location: "Canal Street",   city: "New York", year: "2002" },
];

const CARD_COUNT = CARDS.length;
const CARD_W = 480;
const CARD_GAP = 24;
const LOOPS = 30;
const TOTAL = CARD_COUNT * LOOPS;
const BOTTOM_PAD = 120;
const SIDE_PAD = 48;
const CARD_STEP = CARD_W + CARD_GAP;
const CENTER_LIFT = 80;
const CURVE = 0.00010;
const LERP = 0.1;

export default function CardShelf() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardTextRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const CARD_H_PX = vh * 0.5;
    const firstCardCenter = SIDE_PAD + CARD_W / 2;
    const midScroll = Math.floor(LOOPS / 2) * CARD_COUNT * CARD_STEP;

    const VERT = /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const FRAG = /* glsl */`
      uniform sampler2D uTexture;
      uniform float uProgress;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uTime;
      varying vec2 vUv;

      const float W = ${CARD_W}.0;
      const float H = ${CARD_H_PX.toFixed(1)};
      const float R = 16.0;

      float hash(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p.yx + 19.19 + uSeed);
        return fract((p.x + p.y) * p.x);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        v += a*noise(p); p *= 2.1; a *= 0.5;
        v += a*noise(p); p *= 2.1; a *= 0.5;
        v += a*noise(p); p *= 2.1; a *= 0.5;
        v += a*noise(p); p *= 2.1; a *= 0.5;
        v += a*noise(p);
        return v;
      }

      void main() {
        // Rounded corners
        vec2 px = vUv * vec2(W, H);
        vec2 nearest = clamp(px, vec2(R), vec2(W - R, H - R));
        float cornerAlpha = 1.0 - smoothstep(R - 1.0, R + 1.0, length(px - nearest));

        // Base texture
        vec3 texColor = texture2D(uTexture, vUv).rgb;

        // Chromatic aberration — peaks at mid-transition for a shoegaze bleed
        float midPeak = sin(uProgress * 3.14159);
        float aberr = midPeak * 0.013;
        vec3 abColor = vec3(
          texture2D(uTexture, vUv + vec2(aberr, 0.0)).r,
          texColor.g,
          texture2D(uTexture, vUv - vec2(aberr, 0.0)).b
        );
        vec3 revealColor = mix(texColor, abColor, midPeak * 0.75);

        float luma = dot(texColor, vec3(0.299, 0.587, 0.114));
        vec3 grey = vec3(luma);

        // Large, blotchy blobs — low scale for big shapes, strong warp to deform them
        vec2 base = vUv * 1.2 + vec2(uSeed * 3.1, uSeed * 1.7);
        float q1 = fbm(base + vec2(uTime * 0.38, uTime * 0.26));
        float q2 = fbm(base + vec2(1.7 + uTime * 0.30, 9.2 + uTime * 0.22));
        vec2 warp = vec2(q1, q2);
        float n = fbm(vUv * 1.2 + warp * 2.8 + vec2(uSeed * 7.3, uSeed * 2.1));

        // Pulsating boundary — blobs breathe and ooze
        float pulse = sin(uTime * 1.6 + uSeed * 4.1) * 0.10 * sin(uProgress * 3.14159);

        // Grain adds texture to blob skin
        float grain = hash(vUv * 120.0 + vec2(uTime * 47.0, uTime * 31.0));
        float threshold = mix(n + pulse, grain, 0.22);

        // Tighter edge = more defined blob boundaries
        float reveal = smoothstep(threshold - 0.22, threshold + 0.22, uProgress);

        vec3 color = mix(grey, revealColor, reveal);
        gl_FragColor = vec4(color, cornerAlpha * uOpacity);
      }
    `;

    async function init() {
      const THREE = await import("three");

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(vw, vh);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-vw / 2, vw / 2, vh / 2, -vh / 2, 0.1, 100);
      camera.position.z = 1;

      // Load one texture per unique image
      const loader = new THREE.TextureLoader();
      const textures: THREE.Texture[] = await Promise.all(
        CARDS.map(card => new Promise<THREE.Texture>(resolve => {
          loader.load(card.src, tex => {
            tex.colorSpace = THREE.LinearSRGBColorSpace;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            resolve(tex);
          });
        }))
      );

      const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H_PX);

      const meshes = Array.from({ length: TOTAL }, (_, i) => {
        const ci = i % CARD_COUNT;
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uTexture:  { value: textures[ci] },
            uProgress: { value: 0.0 },
            uOpacity:  { value: 0.0 },
            uSeed:     { value: ci + 0.37 },
            uTime:     { value: 0.0 },
          },
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
        });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.visible = false;
        scene.add(mesh);
        return mesh;
      });

      const scrollMV = motionValue(midScroll);
      let snapIndex = Math.floor(LOOPS / 2) * CARD_COUNT;
      let pointerDown = false;
      let lastPointerX = 0;
      let dragTarget = midScroll;
      let velocitySamples: number[] = [];
      let springAnim: ReturnType<typeof animate> | null = null;
      let lastActive = -1;
      let lastNearestIndex = -1;
      const progresses = new Float32Array(TOTAL);
      let globalTime = 0;
      let rafId: number;

      const springTo = (target: number, vel = 0) => {
        springAnim?.stop();
        springAnim = animate(scrollMV, target, {
          type: "spring",
          stiffness: 110,
          damping: 23,
          mass: 1.6,
          velocity: vel,
        });
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        springAnim?.stop();
        scrollMV.set(scrollMV.get() + (e.deltaY + e.deltaX));
        const ni = Math.round((scrollMV.get() + vw / 2 - firstCardCenter) / CARD_STEP);
        snapIndex = ni;
        springTo(firstCardCenter + ni * CARD_STEP - vw / 2);
      };

      const onPointerDown = (e: PointerEvent) => {
        springAnim?.stop();
        pointerDown = true;
        dragTarget = scrollMV.get();
        velocitySamples = [];
        lastPointerX = e.clientX;
        wrapper.setPointerCapture(e.pointerId);
        wrapper.style.cursor = "grabbing";
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!pointerDown) return;
        const delta = lastPointerX - e.clientX;
        // Gentle velocity scaling — keeps sensitivity calm
        const mult = 1.0 + Math.min(Math.abs(delta) / 20, 0.6);
        const scaled = delta * mult;
        dragTarget += scaled;
        velocitySamples.push(scaled);
        if (velocitySamples.length > 4) velocitySamples.shift();
        lastPointerX = e.clientX;
      };

      const onPointerUp = () => {
        if (!pointerDown) return;
        pointerDown = false;
        wrapper.style.cursor = "grab";
        const avgVel = velocitySamples.length
          ? velocitySamples.reduce((a, b) => a + b, 0) / velocitySamples.length
          : 0;
        velocitySamples = [];
        const ni = Math.round((dragTarget + avgVel * 18 + vw / 2 - firstCardCenter) / CARD_STEP);
        snapIndex = ni;
        springTo(firstCardCenter + ni * CARD_STEP - vw / 2, avgVel * 80);
      };

      wrapper.addEventListener("wheel", onWheel, { passive: false });
      wrapper.addEventListener("pointerdown", onPointerDown);
      wrapper.addEventListener("pointermove", onPointerMove);
      wrapper.addEventListener("pointerup", onPointerUp);
      wrapper.addEventListener("pointercancel", onPointerUp);
      wrapper.style.cursor = "grab";

      function raf() {
        globalTime += 0.022;

        // During drag: fluid pursuit of target
        if (pointerDown) {
          const current = scrollMV.get();
          scrollMV.set(current + (dragTarget - current) * 0.16);
        }

        const displayScroll = scrollMV.get();
        content.style.transform = `translateX(${-displayScroll.toFixed(2)}px)`;

        const focusedMeshIndex = ((snapIndex % TOTAL) + TOTAL) % TOTAL;
        const nearestIndex = snapIndex;
        const viewCenter = vw / 2;

        // Pass 1 — write DOM arc transforms
        for (let i = 0; i < TOTAL; i++) {
          const el = cardRefs.current[i];
          if (!el) continue;
          const cardCenterX = SIDE_PAD + i * CARD_STEP + CARD_W / 2 - displayScroll;
          const dist = cardCenterX - viewCenter;
          if (Math.abs(dist) > vw * 1.5) { meshes[i].visible = false; continue; }
          const lift = CENTER_LIFT - dist * dist * CURVE;
          const scale = Math.max(0.88, 1 - Math.abs(dist) / vw * 0.3);
          el.style.transform = `translateY(${-lift.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        }

        // Pass 2 — read rects, sync WebGL meshes
        for (let i = 0; i < TOTAL; i++) {
          const cardCenterX = SIDE_PAD + i * CARD_STEP + CARD_W / 2 - displayScroll;
          const dist = cardCenterX - viewCenter;
          if (Math.abs(dist) > vw * 1.5) continue;

          const el = cardRefs.current[i];
          if (!el) continue;
          const rect = el.getBoundingClientRect();

          const cx = rect.left + rect.width / 2 - vw / 2;
          const cy = -(rect.top + rect.height / 2 - vh / 2);
          const distInCards = Math.abs(dist) / CARD_STEP;
          const opacity = Math.max(0, 1 - distInCards * 0.3);

          const isFocused = i === focusedMeshIndex;
          progresses[i] += ((isFocused ? 1.0 : 0.0) - progresses[i]) * (isFocused ? 0.014 : 0.10);

          const mesh = meshes[i];
          mesh.visible = true;
          mesh.position.set(cx, cy, 0);
          mesh.scale.set(rect.width / CARD_W, rect.height / CARD_H_PX, 1);
          const u = (mesh.material as THREE.ShaderMaterial).uniforms;
          u.uOpacity.value = opacity;
          u.uProgress.value = progresses[i];
          u.uTime.value = globalTime;
        }

        // Update text when focused card changes
        const activeCard = ((nearestIndex % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
        if (activeCard !== lastActive || nearestIndex !== lastNearestIndex) {
          if (activeCard !== lastActive) {
            lastActive = activeCard;
            const card = CARDS[activeCard];
            const ct = cardTextRef.current;
            if (ct) { ct.style.opacity = "0"; ct.style.transform = "translateX(-50%) translateY(6px)"; }
            setTimeout(() => {
              if (locationRef.current) locationRef.current.textContent = card.location;
              if (cityRef.current) cityRef.current.textContent = card.city;
              if (yearRef.current) yearRef.current.textContent = card.year;
              if (indexRef.current) indexRef.current.textContent =
                String(activeCard + 1).padStart(2, "0") + " / " + String(CARD_COUNT).padStart(2, "0");
if (ct) { ct.style.opacity = "1"; ct.style.transform = "translateX(-50%) translateY(0px)"; }
            }, 120);
          }
          lastNearestIndex = nearestIndex;
        }

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
      return () => {
        cancelAnimationFrame(rafId);
        wrapper.removeEventListener("wheel", onWheel);
        wrapper.removeEventListener("pointerdown", onPointerDown);
        wrapper.removeEventListener("pointermove", onPointerMove);
        wrapper.removeEventListener("pointerup", onPointerUp);
        wrapper.removeEventListener("pointercancel", onPointerUp);
        springAnim?.stop();
        scrollMV.destroy();
        renderer.dispose();
      };
    }

    let cleanup: (() => void) | undefined;
    init().then(fn => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  return (
    <div style={{ height: "100vh", background: theme.bg, overflow: "hidden", position: "relative" }}>

      {/* Three.js canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
      />

      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "40px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        pointerEvents: "none", zIndex: 10,
      }}>
        <div style={{ fontFamily: "var(--font-mdui), sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.text.muted }}>
          Street Archive
        </div>
        <div style={{ textAlign: "right" }}>
          <div ref={indexRef} style={{ fontFamily: "var(--font-mdui), sans-serif", fontSize: 11, letterSpacing: "0.14em", color: theme.text.muted, marginBottom: 4 }}>
            01 / {String(CARD_COUNT).padStart(2, "0")}
          </div>
          <div style={{ fontFamily: "var(--font-mdui), sans-serif", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.text.muted }}>
            Scroll to browse
          </div>
        </div>
      </div>

      {/* Text above focused card */}
      <div ref={cardTextRef} style={{
        position: "absolute",
        bottom: `calc(50vh + ${BOTTOM_PAD + CENTER_LIFT + 48}px)`,
        left: "50%",
        transform: "translateX(-50%) translateY(0px)",
        textAlign: "center",
        pointerEvents: "none", zIndex: 10, opacity: 1,
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>
        <div ref={locationRef} style={{ fontFamily: "var(--font-mdui), sans-serif", fontSize: 26, color: theme.text.primary, whiteSpace: "nowrap", lineHeight: 1.1 }}>
          {CARDS[0].location}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6 }}>
          <div ref={cityRef} style={{ fontFamily: "var(--font-mdui), sans-serif", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.text.muted }}>
            {CARDS[0].city}
          </div>
          <div style={{ color: theme.text.muted, fontSize: 11 }}>·</div>
          <div ref={yearRef} style={{ fontFamily: "var(--font-mdui), sans-serif", fontSize: 11, letterSpacing: "0.14em", color: theme.text.muted }}>
            {CARDS[0].year}
          </div>
        </div>
      </div>

      {/* Card track — DOM cards are invisible placeholders for position */}
      <div ref={wrapperRef} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100vh", overflow: "hidden" }}>
        <div ref={contentRef} style={{ display: "flex", alignItems: "flex-end", gap: CARD_GAP, padding: `0 ${SIDE_PAD}px ${BOTTOM_PAD}px`, width: "fit-content", height: "100%" }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                flexShrink: 0, width: CARD_W, height: "50vh",
                borderRadius: 16,
                transformOrigin: "bottom center",
                position: "relative",
              }}
            >
              <Image
                src={CARDS[i % CARD_COUNT].src}
                alt="" fill
                style={{ objectFit: "cover", visibility: "hidden" }}
                priority={i === Math.floor(TOTAL / 2)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
