"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type * as THREE from "three";
import styles from "./infinite-canvas.module.css";

// ── Grid ───────────────────────────────────────────────────────────────────────

const CARD     = 1.8;
const GAP      = 2.4;
const STRIDE   = CARD + GAP;
const GRID_N   = 15;
const HALF_N   = Math.floor(GRID_N / 2);
const SEGMENTS = 24;

// ── Depth ──────────────────────────────────────────────────────────────────────

const CAM_Z   = 10;
const MAX_Z   =  4.2;
const MIN_Z   = -8.0;
const DEPTH_R = 13.0;

// ── Physics ────────────────────────────────────────────────────────────────────

const LERP  = 0.09;
const DECAY = 0.88;
const FOV   = 55;

// ── Squish ─────────────────────────────────────────────────────────────────────

const SQUISH_DEPTH    = 5.5;
const SQUISH_R        = 6.5;
const SQUISH_LERP_IN  = 0.16;
const SQUISH_LERP_OUT = 0.04;

// ── Images & content ───────────────────────────────────────────────────────────

const IMAGES = Array.from({ length: 30 }, (_, i) => `/infinite-canvas/img-${i + 1}.png`);

const CONTENT: { title: string; room: string; year: string }[] = [
  { title: "Afternoon Study",       room: "Living Room",     year: "2001" },
  { title: "Steel Kitchen",         room: "Kitchen",         year: "1999" },
  { title: "Nightstand Radio",      room: "Bedroom",         year: "2000" },
  { title: "The iMac Desk",         room: "Home Office",     year: "2002" },
  { title: "Yellow Room",           room: "Living Room",     year: "2000" },
  { title: "Kitchen, Morning",      room: "Kitchen",         year: "1998" },
  { title: "Corner Study",          room: "Home Office",     year: "1999" },
  { title: "The Conservatory",      room: "Sunroom",         year: "1997" },
  { title: "Home Gym",              room: "Gym",             year: "2001" },
  { title: "Reading Corner",        room: "Study",           year: "2002" },
  { title: "The Home Bar",          room: "Bar",             year: "1999" },
  { title: "The Entryway",          room: "Entryway",        year: "2000" },
  { title: "Working from Home",     room: "Home Office",     year: "1994" },
  { title: "White Living Room",     room: "Living Room",     year: "1998" },
  { title: "Garden Patio",          room: "Outdoor",         year: "1997" },
  { title: "Breakfast Nook",        room: "Breakfast Room",  year: "1998" },
  { title: "Clawfoot Bath",         room: "Bathroom",        year: "1999" },
  { title: "The Screening Room",    room: "Cinema",          year: "2000" },
  { title: "Basement Rec Room",     room: "Rec Room",        year: "1995" },
  { title: "Stone Fireplace",       room: "Living Room",     year: "1998" },
  { title: "The Loft Studio",       room: "Studio",          year: "2002" },
  { title: "Summer Deck",           room: "Outdoor",         year: "1999" },
  { title: "Poolside",              room: "Outdoor",         year: "1997" },
  { title: "The Kitchen Island",    room: "Kitchen",         year: "2001" },
  { title: "The Staircase",         room: "Entryway",        year: "2000" },
  { title: "The Media Room",        room: "Media Room",      year: "2001" },
  { title: "The Pergola",           room: "Outdoor",         year: "1998" },
  { title: "Bay Window",            room: "Living Room",     year: "1997" },
  { title: "Screened Porch",        room: "Porch",           year: "1999" },
  { title: "Log Cabin",             room: "Living Room",     year: "1998" },
];

function imgKey(i: number, j: number): number {
  return Math.abs(i * 7 + j * 13 + i * j * 3) % IMAGES.length;
}

// ── Shaders ────────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
  varying vec2 vUv;
  uniform vec2  pressWorld;
  uniform float squishAmt;

  void main() {
    vUv = uv;
    vec2  wp   = (modelMatrix * vec4(position, 1.0)).xy;
    float dist = length(wp - pressWorld);
    float t    = dist / ${SQUISH_R.toFixed(1)};
    float disp = -${SQUISH_DEPTH.toFixed(1)} * squishAmt * exp(-t * t * 0.5);
    gl_Position = projectionMatrix * modelViewMatrix *
                  vec4(position.xy, position.z + disp, 1.0);
  }
`;

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D map;
  uniform float radius;
  uniform vec3  bgColor;
  uniform float depthFactor;
  uniform float aspect;

  void main() {
    // Object-fit cover
    vec2 uv = vUv;
    if (aspect > 1.0) {
      uv.x = (aspect - 1.0) / (2.0 * aspect) + vUv.x / aspect;
    } else if (aspect < 1.0) {
      uv.y = (1.0 - aspect) / 2.0 + vUv.y * aspect;
    }

    // Rounded corners — anti-aliased SDF
    vec2  q     = abs(vUv - 0.5) - (0.5 - radius);
    float d     = length(max(q, 0.0)) - radius;
    float fw    = fwidth(d);
    float alpha = 1.0 - smoothstep(-fw, fw, d);
    if (alpha < 0.01) discard;

    vec3 img   = texture2D(map, uv).rgb;
    vec3 color = mix(img, bgColor, depthFactor * 0.72);

    gl_FragColor = vec4(mix(bgColor, color, alpha), 1.0);
  }
`;

// ── Page ───────────────────────────────────────────────────────────────────────

const BG = 0xF4EFE6;

export default function InfiniteCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [snapped, setSnapped] = useState<number | null>(null);

  useEffect(() => {
    let animId: number;
    let disposed = false;
    let doCleanup: (() => void) | null = null;

    import("three").then((THREE) => {
      if (disposed || !mountRef.current) return;

      const W = window.innerWidth;
      const H = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(BG);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mountRef.current.appendChild(renderer.domElement);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 200);
      camera.position.set(0, 0, CAM_Z);

      const loader  = new THREE.TextureLoader();
      const aspects = new Array(IMAGES.length).fill(1.0);
      const textures = IMAGES.map((src, idx) =>
        loader.load(src, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const w = (tex.image as HTMLImageElement).naturalWidth  || tex.image.width;
          const h = (tex.image as HTMLImageElement).naturalHeight || tex.image.height;
          aspects[idx] = w / h;
          for (let si = 0; si < GRID_N; si++)
            for (let sj = 0; sj < GRID_N; sj++)
              if (meshes[si]?.[sj]?.userData.texKey === idx)
                (meshes[si][sj].material as THREE.ShaderMaterial).uniforms.aspect.value = aspects[idx];
        })
      );

      const cardGeo  = new THREE.PlaneGeometry(CARD, CARD, SEGMENTS, SEGMENTS);
      const bgColor  = new THREE.Color(BG);
      const pressVec = new THREE.Vector2(0, 0);
      const meshes:  THREE.Mesh[][] = [];

      for (let si = 0; si < GRID_N; si++) {
        meshes[si] = [];
        for (let sj = 0; sj < GRID_N; sj++) {
          const gi  = si - HALF_N;
          const gj  = sj - HALF_N;
          const key = imgKey(gi, gj);

          const mat = new THREE.ShaderMaterial({
            uniforms: {
              map:         { value: textures[key] },
              radius:      { value: 0.07 },
              bgColor:     { value: bgColor },
              depthFactor: { value: 0.5 },
              aspect:      { value: aspects[key] },
              pressWorld:  { value: pressVec },
              squishAmt:   { value: 0 },
            },
            vertexShader:   VERT,
            fragmentShader: FRAG,
          });
          const mesh = new THREE.Mesh(cardGeo, mat);
          mesh.frustumCulled = false;
          mesh.userData = { i: gi, j: gj, texKey: key };
          mesh.position.set(gi * STRIDE, gj * STRIDE, 0);
          scene.add(mesh);
          meshes[si].push(mesh);
        }
      }

      let camX = 0, camY = 0;
      let targetX = 0, targetY = 0;
      let isDragging = false;
      let lastPX = 0, lastPY = 0;
      let vx = 0, vy = 0;
      let prevT = performance.now();
      let wheelTimer: ReturnType<typeof setTimeout> | null = null;
      let snapPending: number | null = null;
      let squishAmount = 0, squishTarget = 0;

      const worldScale = () => {
        const visH = 2 * Math.tan((FOV / 2) * (Math.PI / 180)) * CAM_Z;
        return visH / window.innerHeight;
      };

      const snapToNearest = () => {
        const iNearest = Math.round(targetX / STRIDE);
        const jNearest = Math.round(targetY / STRIDE);
        targetX = iNearest * STRIDE;
        targetY = jNearest * STRIDE;
        vx = 0; vy = 0;
        snapPending = imgKey(iNearest, jNearest);
      };

      const updatePressWorld = (ex: number, ey: number) => {
        const s = worldScale();
        pressVec.set(
          camX + (ex - window.innerWidth  / 2) * s,
          camY - (ey - window.innerHeight / 2) * s,
        );
      };

      const el = renderer.domElement;

      const onDown = (e: PointerEvent) => {
        el.setPointerCapture(e.pointerId);
        isDragging = true;
        lastPX = e.clientX; lastPY = e.clientY;
        vx = 0; vy = 0;
        prevT = performance.now();
        if (wheelTimer) clearTimeout(wheelTimer);
        setSnapped(null);
        updatePressWorld(e.clientX, e.clientY);
        squishTarget = 1;
      };

      const onMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const now = performance.now();
        const dt  = Math.max(now - prevT, 1);
        prevT = now;
        const s  = worldScale();
        const dx = -(e.clientX - lastPX) * s;
        const dy =  (e.clientY - lastPY) * s;
        lastPX = e.clientX; lastPY = e.clientY;
        targetX += dx; targetY += dy;
        vx = vx * 0.72 + (dx / dt) * 16 * 0.28;
        vy = vy * 0.72 + (dy / dt) * 16 * 0.28;
        updatePressWorld(e.clientX, e.clientY);
      };

      const onUp = () => {
        if (!isDragging) return;
        isDragging = false;
        squishTarget = 0;
        snapToNearest();
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const s = worldScale();
        targetX += e.deltaX * s;
        targetY -= e.deltaY * s;
        setSnapped(null);
        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(snapToNearest, 650);
      };

      el.addEventListener("pointerdown",   onDown);
      el.addEventListener("pointermove",   onMove);
      el.addEventListener("pointerup",     onUp);
      el.addEventListener("pointercancel", onUp);
      el.addEventListener("wheel", onWheel, { passive: false });

      const onResize = () => {
        const W = window.innerWidth, H = window.innerHeight;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      };
      window.addEventListener("resize", onResize);

      const animate = () => {
        animId = requestAnimationFrame(animate);

        if (!isDragging) {
          targetX += vx; targetY += vy;
          vx *= DECAY;   vy *= DECAY;
        }
        camX += (targetX - camX) * LERP;
        camY += (targetY - camY) * LERP;
        camera.position.set(camX, camY, CAM_Z);

        const sl = squishTarget > squishAmount ? SQUISH_LERP_IN : SQUISH_LERP_OUT;
        squishAmount += (squishTarget - squishAmount) * sl;

        if (snapPending !== null &&
            Math.abs(targetX - camX) < 0.015 &&
            Math.abs(targetY - camY) < 0.015) {
          setSnapped(snapPending);
          snapPending = null;
        }

        const iCenter = Math.round(camX / STRIDE);
        const jCenter = Math.round(camY / STRIDE);

        for (let si = 0; si < GRID_N; si++) {
          for (let sj = 0; sj < GRID_N; sj++) {
            const mesh = meshes[si][sj];
            const ti   = iCenter - HALF_N + si;
            const tj   = jCenter - HALF_N + sj;

            if (mesh.userData.i !== ti || mesh.userData.j !== tj) {
              mesh.userData.i = ti;
              mesh.userData.j = tj;
              const key = imgKey(ti, tj);
              if (mesh.userData.texKey !== key) {
                mesh.userData.texKey = key;
                const u = (mesh.material as THREE.ShaderMaterial).uniforms;
                u.map.value    = textures[key];
                u.aspect.value = aspects[key];
              }
            }

            const wx = ti * STRIDE;
            const wy = tj * STRIDE;
            const depthDist = Math.hypot(wx - camX, wy - camY);
            const depthZ    = MIN_Z + (MAX_Z - MIN_Z) *
              Math.exp(-(depthDist * depthDist) / (DEPTH_R * DEPTH_R));
            const depthFactor = Math.max(0, Math.min(1, (MAX_Z - depthZ) / (MAX_Z - MIN_Z)));

            mesh.position.set(wx, wy, depthZ);
            const u = (mesh.material as THREE.ShaderMaterial).uniforms;
            u.squishAmt.value   = squishAmount;
            u.depthFactor.value = depthFactor;
          }
        }

        renderer.render(scene, camera);
      };
      animate();

      doCleanup = () => {
        el.removeEventListener("pointerdown",   onDown);
        el.removeEventListener("pointermove",   onMove);
        el.removeEventListener("pointerup",     onUp);
        el.removeEventListener("pointercancel", onUp);
        el.removeEventListener("wheel", onWheel);
        window.removeEventListener("resize", onResize);
        if (wheelTimer) clearTimeout(wheelTimer);
        cancelAnimationFrame(animId);
        scene.clear();
        cardGeo.dispose();
        textures.forEach(t => t.dispose());
        renderer.dispose();
        if (mountRef.current?.contains(renderer.domElement))
          mountRef.current.removeChild(renderer.domElement);
      };
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      doCleanup?.();
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: "100vw", height: "100vh", background: `#${BG.toString(16).padStart(6, "0")}`, cursor: "grab", userSelect: "none" }}
      />
      <AnimatePresence mode="wait">
        {snapped !== null && (
          <motion.div
            key={snapped}
            className={styles.cardLabel}
            style={{ x: "-50%" }}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 7 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className={styles.cardTitle}>{CONTENT[snapped].title}</div>
            <div className={styles.cardDivider} />
            <div className={styles.cardMeta}>{CONTENT[snapped].room}&nbsp;&nbsp;·&nbsp;&nbsp;{CONTENT[snapped].year}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={styles.cornerLabel}>
        Infinite Canvas<br /><span style={{ opacity: 0.5 }}>Drag · Scroll</span>
      </div>
    </>
  );
}
