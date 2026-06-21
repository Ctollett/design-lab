"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import type * as THREE from "three";
import styles from "./3d-carousel.module.css";

// ── Data ──────────────────────────────────────────────────────────────────────

const ITEMS = [
  { src: "/3d-carousel/img-1.png", title: "Fly Agaric",     room: "Amanita muscaria"    },
  { src: "/3d-carousel/img-2.png", title: "Gill Study",      room: "Basidiomycota"       },
  { src: "/3d-carousel/img-3.png", title: "Oyster Cascade",  room: "Pleurotus ostreatus" },
  { src: "/3d-carousel/img-4.png", title: "Giant Puffball",  room: "Calvatia gigantea"   },
  { src: "/3d-carousel/img-5.png", title: "Turkey Tail",     room: "Trametes versicolor" },
  { src: "/3d-carousel/img-6.png", title: "Death Cap",       room: "Amanita phalloides"  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const N = ITEMS.length;
const ANGLE   = (Math.PI * 2) / N;
const RADIUS  = 2.4;
const CARD    = 0.72;
const SEGS    = 40;
const CAM_Z   = 4.8;
const FOV     = 62;

const SCROLL_HEIGHT = 8000;
const SCROLL_FACTOR = (Math.PI * 2 * 1.5) / SCROLL_HEIGHT;

// ── Shaders ───────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
  varying vec2 vUv;
  varying float vWave;
  varying vec3 vNormal;
  uniform float time;
  uniform float waveAmt;
  uniform float waveDir;
  uniform float phase;
  uniform float grabAmt;
  uniform float impactAmt;

  void main() {
    vUv = uv;
    float hang    = 1.0 - vUv.y;
    float xNorm   = position.x / 0.36;
    float corners = 1.0 + 0.9 * xNorm * xNorm;

    float primary    = (waveDir + sin(time * 3.2 + phase) * 0.9) * hang * corners;
    float flagRipple = sin(position.y * 6.5 + time * 4.2 + phase * 1.1)
                     * (0.55 + 0.45 * cos(position.x * 3.0 + phase * 0.9))
                     * hang * 0.55;
    float z = (primary + flagRipple) * waveAmt;
    vWave = z;

    // Gaussian press dent — centre pushes back
    float radSq    = dot(position.xy, position.xy);
    float pressed  = grabAmt * 0.11 * exp(-radSq * 5.5);
    // Smooth plate-flex: edges/corners bow forward as centre is pressed.
    // Shape is a plain polynomial — no oscillation — organic motion comes from spring overshoot.
    float yNorm    = position.y / 0.36;
    float edgeDist = (xNorm * xNorm + yNorm * yNorm) * 0.5;
    float flare    = (grabAmt + impactAmt * 0.5) * 0.065 * edgeDist;

    // Cylindrical warp: card curves to follow the carousel circle so side
    // cards show surface area to the camera rather than going edge-on.
    float cylWarp  = -(position.x * position.x) / (2.0 * 2.4);

    float finalZ   = position.z + z - pressed + flare + cylWarp;

    // Analytically differentiate the wave function to get surface tangents.
    // This gives the true local normal rather than a screen-space approximation.
    float C    = waveDir + sin(time * 3.2 + phase) * 0.9;
    float sinY = sin(position.y * 6.5 + time * 4.2 + phase * 1.1);
    float cosY = cos(position.y * 6.5 + time * 4.2 + phase * 1.1);
    float Xmod  =  0.55 + 0.45 * cos(position.x * 3.0 + phase * 0.9);
    float dXmod = -1.35 * sin(position.x * 3.0 + phase * 0.9);

    // d(z)/dx, d(z)/dy — chain rule through primary and flagRipple
    float dzdx = (C * hang * 13.889 * position.x
                + sinY * dXmod * hang * 0.55) * waveAmt;
    float dzdy = (C * (-1.3889) * corners
                + (cosY * 6.5 * Xmod * hang + sinY * Xmod * (-1.3889)) * 0.55) * waveAmt;

    // Height-field normal: cross(dP/dx, dP/dy) = (-dz/dx, -dz/dy, 1)
    // Transform to view space so cosTheta is camera-relative in the frag shader
    vNormal = normalize(normalMatrix * normalize(vec3(-dzdx, -dzdy, 1.0)));

    gl_Position = projectionMatrix * modelViewMatrix
                * vec4(position.x, position.y, finalZ, 1.0);
  }
`;

const FRAG = /* glsl */`
  varying vec2 vUv;
  varying float vWave;
  varying vec3 vNormal;
  uniform sampler2D map;
  uniform float radius;
  uniform float depthAmt;
  uniform float blurAmt;

  void main() {
    vec2 q = abs(vUv - 0.5) - (0.5 - radius);
    float dist = length(max(q, 0.0)) - radius;
    float fw = fwidth(dist);
    float alpha = 1.0 - smoothstep(-fw, fw, dist);
    if (alpha < 0.01) discard;

    // Motion blur — sample along U in the direction of spin
    vec3 base = vec3(0.0);
    const int BLUR_SAMPLES = 9;
    for (int s = 0; s < BLUR_SAMPLES; s++) {
      float t   = float(s) / float(BLUR_SAMPLES - 1) - 0.5;
      vec2  buv = vec2(clamp(vUv.x + blurAmt * t, 0.001, 0.999), vUv.y);
      base += texture2D(map, buv).rgb;
    }
    base /= float(BLUR_SAMPLES);

    vec3  N       = normalize(vNormal);
    float tiltMag = length(N.xy);

    // Motion sheen — bright white gloss that catches during waves
    float d    = atan(N.y, N.x) + tiltMag * 10.0;
    vec3  tint = vec3(
      0.5 + 0.26 * cos(d),
      0.5 + 0.26 * cos(d + 2.094),
      0.5 + 0.26 * cos(d + 4.189)
    );
    vec3  sheenColor = mix(vec3(1.0), tint, clamp(tiltMag * 0.9, 0.0, 0.14));
    float luma       = dot(base, vec3(0.299, 0.587, 0.114));
    float intensity  = clamp(abs(vWave) * 11.0 + tiltMag * 0.45, 0.0, 0.28)
                     * (0.45 + 0.55 * luma);
    vec3 color = 1.0 - (1.0 - base) * (1.0 - sheenColor * intensity);

    // Thin-film iridescence — only on the front card, fades as cards rotate away.
    float filmPhase = vUv.y * 5.5 + vUv.x * 1.8 + atan(N.y, N.x) * 1.6 + vWave * 10.0;
    vec3 film = vec3(
      0.5 + 0.5 * cos(filmPhase),
      0.5 + 0.5 * cos(filmPhase + 2.094),
      0.5 + 0.5 * cos(filmPhase + 4.189)
    );
    float frontness = 1.0 - smoothstep(0.0, 0.35, depthAmt);
    float filmAmt = clamp(0.022 + tiltMag * 0.045 + abs(vWave) * 0.11, 0.015, 0.065) * frontness;
    color = 1.0 - (1.0 - color) * (1.0 - film * filmAmt);

    // Depth darkening — side and back cards fall into shadow
    float shadow = smoothstep(0.0, 1.0, depthAmt) * 0.52;
    color *= (1.0 - shadow);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Carousel3D() {
  const [active, setActive] = useState(0);

  const mountRef   = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    let disposed = false;
    let doCleanup: (() => void) | null = null;

    import("three").then((THREE) => {
      if (disposed || !mountRef.current || !wrapperRef.current || !contentRef.current) return;

      // ── Renderer ──────────────────────────────────────────────────────────
      const W = window.innerWidth, H = window.innerHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0xF4EFE6);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mountRef.current.appendChild(renderer.domElement);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 100);
      camera.position.z = CAM_Z;

      // ── Geometry & pivot ──────────────────────────────────────────────────
      const geo   = new THREE.PlaneGeometry(CARD, CARD, SEGS, SEGS);
      const pivot = new THREE.Group();
      scene.add(pivot);

      // ── Cards ─────────────────────────────────────────────────────────────
      const loader  = new THREE.TextureLoader();
      const meshes: THREE.Mesh[] = [];

      ITEMS.forEach((item, i) => {
        const tex = loader.load(item.src, (t) => { t.colorSpace = THREE.SRGBColorSpace; });

        const mat = new THREE.ShaderMaterial({
          uniforms: {
            map:      { value: tex },
            radius:   { value: 0.07 },
            time:     { value: 0 },
            waveAmt:  { value: 0 },
            waveDir:  { value: 0 },
            phase:    { value: i * 0.9 },
            grabAmt:   { value: 0 },
            impactAmt: { value: 0 },
            depthAmt:  { value: 0 },
            blurAmt:   { value: 0 },
          },
          vertexShader:   VERT,
          fragmentShader: FRAG,
          transparent:    true,
          depthWrite:     false,
          side:           THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geo, mat);
        const a = ANGLE * i;
        mesh.position.set(Math.sin(a) * RADIUS, 0, Math.cos(a) * RADIUS);
        mesh.rotation.y = a;
        pivot.add(mesh);
        meshes.push(mesh);
      });

      // Per-mesh spring state for the grab dent and one-shot impact ripple
      const grabPos    = new Float32Array(N);
      const grabVel    = new Float32Array(N);
      const impactAmts = new Float32Array(N);
      let   prevDragging = false;

      // Random per-card settle speeds — cards desync naturally as wave decays
      const waveSettleSpeeds = Float32Array.from({ length: N }, () => 0.05 + Math.random() * 0.07);
      const dirSettleSpeeds  = Float32Array.from({ length: N }, () => 0.03 + Math.random() * 0.06);

      // ── State ─────────────────────────────────────────────────────────────
      let targetRotY     = 0;
      let currentRotY    = 0;
      let prevRotY       = 0;
      let waveTarget     = 0;
      let waveCurrent    = 0;
      let waveDirTarget  = 0;
      let waveDirCurrent = 0;
      let isDragging     = false;
      let dragStartX     = 0;
      let dragStartRot   = 0;
      let prevActiveIdx  = -1;

      // ── Lenis ─────────────────────────────────────────────────────────────
      const lenis = new Lenis({ wrapper: wrapperRef.current!, content: contentRef.current! });

      // Scroll maps to discrete card indices — targetRotY is always a multiple
      // of ANGLE so the carousel can never rest between two images.
      const SCROLL_PER_CARD = SCROLL_HEIGHT / (N * 1.5);
      lenis.on("scroll", ({ scroll }: { scroll: number }) => {
        if (!isDragging) {
          const index = Math.round(scroll / SCROLL_PER_CARD);
          targetRotY = -index * ANGLE;
        }
      });

      // ── Drag ──────────────────────────────────────────────────────────────
      const el = renderer.domElement;

      const onDown = (e: PointerEvent) => {
        isDragging   = true;
        dragStartX   = e.clientX;
        dragStartRot = targetRotY;
        el.setPointerCapture(e.pointerId);
      };

      const onMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const delta = (e.clientX - dragStartX) / window.innerWidth;
        targetRotY  = dragStartRot + delta * Math.PI * 2.5;
      };

      const onUp = () => {
        if (!isDragging) return;
        isDragging = false;
        const index = Math.round(-targetRotY / ANGLE);
        targetRotY  = -index * ANGLE;
        lenis.scrollTo(-targetRotY / SCROLL_FACTOR, { immediate: true });
      };

      el.addEventListener("pointerdown",   onDown);
      el.addEventListener("pointermove",   onMove);
      el.addEventListener("pointerup",     onUp);
      el.addEventListener("pointercancel", onUp);

      // ── Resize ────────────────────────────────────────────────────────────
      const onResize = () => {
        const W = window.innerWidth, H = window.innerHeight;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      };
      window.addEventListener("resize", onResize);

      // ── Animate ───────────────────────────────────────────────────────────
      const startTime = performance.now();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        lenis.raf(performance.now());

        const t = (performance.now() - startTime) / 1000;

        currentRotY += (targetRotY - currentRotY) * 0.09;

        // Derive wave from actual carousel motion — captures both scroll and drag
        const spinDelta = currentRotY - prevRotY;
        prevRotY = currentRotY;
        const spinSpeed = Math.abs(spinDelta);
        if (spinSpeed > 0.00008) {
          waveTarget    = Math.min(spinSpeed * 130, 0.10);
          waveDirTarget = spinDelta > 0 ? 1 : -1;
        }
        waveTarget    *= 0.972;
        waveDirTarget *= 0.968;
        if (waveTarget < 0.0003) { waveTarget = 0; waveDirTarget = 0; }

        waveCurrent    += (waveTarget    - waveCurrent)    * 0.08;
        waveDirCurrent += (waveDirTarget - waveDirCurrent) * 0.06;

        pivot.rotation.y = currentRotY;

        const frontIdx = ((-Math.round(targetRotY / ANGLE)) % N + N) % N;
        if (frontIdx !== prevActiveIdx) {
          prevActiveIdx = frontIdx;
          setActive(frontIdx);
        }

        const justPressed = isDragging && !prevDragging;
        prevDragging = isDragging;

        // Signed blur: direction from spinDelta, magnitude from speed. Capped at ±0.038 UV units.
        const blurTarget = Math.max(-0.038, Math.min(0.038, spinDelta * 11.0));

        meshes.forEach((mesh, i) => {
          const u = (mesh.material as THREE.ShaderMaterial).uniforms;
          u.time.value    = t;
          u.waveAmt.value += (waveCurrent    - u.waveAmt.value) * waveSettleSpeeds[i];
          u.waveDir.value += (waveDirCurrent - u.waveDir.value) * dirSettleSpeeds[i];
          // Underdamped spring for grab dent — overshoots on press & release
          const grabTarget = (isDragging && i === frontIdx) ? 1.0 : 0.0;
          const force = 160 * (grabTarget - grabPos[i]) - 14 * grabVel[i];
          grabVel[i] += force / 60;
          grabPos[i] += grabVel[i] / 60;
          u.grabAmt.value = grabPos[i];
          // One-shot ripple on press, decays to zero — no continuous warping
          if (justPressed && i === frontIdx) impactAmts[i] = 1.0;
          impactAmts[i] *= 0.88;
          u.impactAmt.value = impactAmts[i];
          // Angular distance from camera forward — 0 at front, 1 at back
          let ang = ((ANGLE * i + currentRotY) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          if (ang > Math.PI) ang -= Math.PI * 2;
          u.depthAmt.value = Math.min(Math.abs(ang) / Math.PI, 1.0);
          u.blurAmt.value += (blurTarget - u.blurAmt.value) * 0.18;
        });

        renderer.render(scene, camera);
      };
      animate();

      doCleanup = () => {
        el.removeEventListener("pointerdown",   onDown);
        el.removeEventListener("pointermove",   onMove);
        el.removeEventListener("pointerup",     onUp);
        el.removeEventListener("pointercancel", onUp);
        window.removeEventListener("resize", onResize);
        lenis.destroy();
        geo.dispose();
        meshes.forEach(m => (m.material as THREE.ShaderMaterial).dispose());
        renderer.dispose();
        mountRef.current?.removeChild(renderer.domElement);
      };
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      doCleanup?.();
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div ref={contentRef} className={styles.content}>
        <div className={styles.sticky}>

          <div ref={mountRef} className={styles.mount} />

          <div className={styles.frameTop}>
<AnimatePresence mode="sync">
              <motion.div
                key={`title-${active}`}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className={styles.labelTitle}>{ITEMS[active].title}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.frameBottom}>
            <AnimatePresence mode="sync">
              <motion.div
                key={`meta-${active}`}
                style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "center" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className={styles.labelMeta}>{ITEMS[active].room}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.cornerLabel}>
            3D Carousel<br /><span style={{ opacity: 0.5 }}>Scroll · Drag</span>
          </div>

        </div>
      </div>
    </div>
  );
}
