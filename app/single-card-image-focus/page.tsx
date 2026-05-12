"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { currentTheme } from "@/lib/themes";

const CARDS = [
  {
    src: "/retro-computers/a1000_pastel_blue.png",
    label: "1985",
    title: "Amiga 1000",
    color: "#5B8DB8",
    body: "Commodore's flagship personal computer, the A1000 introduced multitasking and a graphical interface years ahead of its time.",
  },
  {
    src: "/retro-computers/apple_ii_pastel_mint.png",
    label: "1977",
    title: "Apple II",
    color: "#4A9E7E",
    body: "One of the first mass-produced personal computers, the Apple II brought color graphics and an open architecture to the world.",
  },
  {
    src: "/retro-computers/bbc_micro_pastel_peach.png",
    label: "1981",
    title: "BBC Micro",
    color: "#C07060",
    body: "Built for the BBC Computer Literacy Project, the Micro became a cornerstone of a generation's introduction to computing.",
  },
  {
    src: "/retro-computers/olivetti_programma_101_pastel_periwinkle.png",
    label: "1965",
    title: "Olivetti P101",
    color: "#7070C4",
    body: "Often called the world's first personal computer, the Programma 101 brought programmable computing to the desktop.",
  },
  {
    src: "/retro-computers/xerox_alto_pastel_sage.png",
    label: "1973",
    title: "Xerox Alto",
    color: "#5E9E6A",
    body: "The Alto pioneered the graphical user interface, mouse-driven navigation, and the WYSIWYG document model — ideas that changed everything.",
  },
];

const CARD_W = 260;
const CARD_H = 240;
const PEEK = 40;
const PADDING = 3;

const PADDED = [
  ...CARDS.slice(-PADDING).map((c) => ({ src: c.src, ghost: true })),
  ...CARDS.map((c) => ({ ...c, ghost: false })),
  ...CARDS.slice(0, PADDING).map((c) => ({ src: c.src, ghost: true })),
];

const INIT_CARD_STEP = 160;
const LOOPS = 500;

const OVERLAY_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const OVERLAY_FRAG = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;

  float hash(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
  }

  // 3 octaves of smooth value noise for rough glass texture
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    v += noise(p)        * 0.5;
    v += noise(p * 2.1)  * 0.25;
    v += noise(p * 4.3)  * 0.125;
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Edge mask — steep falloff, only strong within ~20% of top/bottom
    float edgeMask = pow(abs(uv.y * 2.0 - 1.0), 4.0);
    // Add corners too
    float cornerMask = pow(abs(uv.x * 2.0 - 1.0), 5.0) * pow(abs(uv.y * 2.0 - 1.0), 1.5);
    float mask = clamp(edgeMask + cornerMask * 0.4, 0.0, 1.0);

    // Rough glass: layered fbm over a fine grid
    vec2 glassUv = uv * vec2(6.0, 3.5);
    float glass = fbm(glassUv);
    // Brighten the midrange so it reads as frosted/etched glass, not just noise
    glass = smoothstep(0.25, 0.75, glass);

    // Glass texture visible only at edges
    float alpha = glass * mask * 0.12;

    gl_FragColor = vec4(vec3(glass), alpha);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  uniform float uDistFromCenter;

  const float HW = ${CARD_W / 2}.0;
  const float HH = ${CARD_H / 2}.0;
  const float PI = 3.14159265;

  void main() {
    vUv = uv;

    float raw = smoothstep(0.6, 1.0, abs(uDistFromCenter));
    float lens = raw; // linear so next card gets ~50% effect naturally

    vec2 n = position.xy / vec2(HW, HH);
    vec3 pos = position;
    float dir = sign(uDistFromCenter);

    // Smooth 0→1 remap across the full card height — no kink, no crease
    // t=0 at center-facing edge, t=1 at screen-boundary edge
    float t = (n.y * dir + 1.0) * 0.5;

    // X: quadratic curve so flare accelerates hard toward the screen boundary
    float xFlare = 0.6 + t * t * 2.6;
    pos.x += sign(n.x + 0.0001) * lens * abs(n.x) * xFlare * HW;

    // Y: stretch entry edge toward screen boundary
    pos.y += dir * lens * t * t * HH * 1.2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uDistFromCenter;
  varying vec2 vUv;

  const float W = ${CARD_W}.0;
  const float H = ${CARD_H}.0;
  const float R = 12.0;

  void main() {
    float raw = smoothstep(0.6, 1.0, abs(uDistFromCenter));
    float lens = raw;

    // Aspect-corrected radial coordinate
    const float aspect = W / H;
    vec2 c = (vUv - 0.5) * vec2(aspect, 1.0);
    float r = length(c);

    // Barrel distortion
    float barrel = 1.0 + lens * 14.0 * r * r;
    vec2 lensUv = c / vec2(aspect, 1.0) * barrel + 0.5;

    // Radial chromatic split — large smeared pink/teal
    float chroma = lens * 1.1;
    vec2 uvR = c / vec2(aspect, 1.0) * (barrel + chroma) + 0.5;
    vec2 uvG = lensUv;
    vec2 uvB = c / vec2(aspect, 1.0) * (barrel - chroma) + 0.5;

    float rVal = texture2D(uTexture, uvR).r;
    float gVal = texture2D(uTexture, uvG).g;
    float bVal = texture2D(uTexture, uvB).b;

    // Specular highlight
    vec2 hlPos = (vUv - 0.5) - vec2(0.0, 0.2);
    float highlight = (1.0 - smoothstep(0.0, 0.28, length(hlPos))) * lens * 1.0;

    // Corner clip — dissolves away as lens fires so the warped vertex shape
    // defines the boundary rather than a hard rectangular mask
    vec2 px = vUv * vec2(W, H);
    vec2 nearest = clamp(px, vec2(R), vec2(W - R, H - R));
    float cornerAlpha = 1.0 - smoothstep(R - 1.0, R + 1.0, length(px - nearest));
    float alpha = mix(cornerAlpha, 1.0, lens);

    vec3 color = vec3(rVal, gVal, bVal) + vec3(highlight);
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;

export default function SingleCardImageFocus() {
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vh = window.innerHeight;
    const cardStep = Math.round((vh / 2 + CARD_H / 2 - PEEK) / PADDING);
    const sectionH = Math.round(vh * 0.7);
    const totalH = CARDS.length * sectionH * LOOPS;
    const midScroll = Math.floor(LOOPS / 2) * CARDS.length * sectionH;
    if (pageRef.current) pageRef.current.style.minHeight = `${vh + totalH}px`;
    window.scrollTo(0, midScroll);

    async function init() {
      const [{ default: Lenis }, THREE] = await Promise.all([
        import("lenis"),
        import("three"),
      ]);

      // ── Renderer ──────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,          // transparent background
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(window.innerWidth, vh);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // ── Scene + orthographic camera ────────────────────────────────────────
      // Units = CSS pixels: (0,0) is viewport center, x goes right, y goes up
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(
        -window.innerWidth / 2,   // left
         window.innerWidth / 2,   // right
         vh / 2,                  // top
        -vh / 2,                  // bottom
        0.1, 100
      );
      camera.position.z = 1;

      // ── Textures ───────────────────────────────────────────────────────────
      // Load each unique image src once, store in a map keyed by src path
      const loader = new THREE.TextureLoader();
      const textures: Record<string, THREE.Texture> = {};

      await Promise.all(
        [...new Set(PADDED.map((c) => c.src))].map(
          (src) =>
            new Promise<void>((resolve) => {
              loader.load(src, (tex) => {
                tex.colorSpace = THREE.LinearSRGBColorSpace;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                textures[src] = tex;
                resolve();
              });
            })
        )
      );

      // ── Meshes ─────────────────────────────────────────────────────────────
      // One flat plane per card, sized to match the DOM card dimensions
      const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H, 32, 32);

      const meshes = PADDED.map((card) => {
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: textures[card.src] },
            uOpacity: { value: 1.0 },
            uDistFromCenter: { value: 0.0 },
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

      // ── Lens overlay ──────────────────────────────────────────────────────
      const overlayMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0.0 } },
        vertexShader: OVERLAY_VERT,
        fragmentShader: OVERLAY_FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const overlayMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(window.innerWidth, vh),
        overlayMat
      );
      overlayMesh.renderOrder = 999;
      scene.add(overlayMesh);

      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      let velocity = 0;
      let scroll = 0;
      let lastActive = -1;
      let rafId: number;

      lenis.on("scroll", (e: { scroll: number; velocity: number }) => {
        scroll = e.scroll;
        velocity = e.velocity; // available for displacement effect
      });

      function raf(t: number) {
        lenis.raf(t);
        overlayMat.uniforms.uTime.value = t * 0.001;

        const rawFloat = ((scroll / sectionH) % CARDS.length + CARDS.length) % CARDS.length;
        const floatIndex = rawFloat + PADDING;
        const newActive = Math.round(rawFloat) % CARDS.length;

        if (newActive !== lastActive) {
          lastActive = newActive;
          if (titleRef.current) {
            titleRef.current.textContent = CARDS[newActive].title;
            titleRef.current.style.color = CARDS[newActive].color;
          }
          if (yearRef.current) {
            yearRef.current.textContent = CARDS[newActive].label;
          }
          for (let i = 0; i < PADDED.length; i++) {
            const inner = innerRefs.current[i];
            if (!inner) continue;
            const focused = i === newActive + PADDING;
            inner.style.border = `1px solid ${focused ? currentTheme.border : currentTheme.borderSubtle}`;
            inner.style.boxShadow = focused
              ? "0 12px 40px rgba(0,0,0,0.18)"
              : "0 4px 12px rgba(0,0,0,0.08)";
          }
        }

        // Pass 1 — write all DOM transforms (batch writes before any reads)
        for (let i = 0; i < PADDED.length; i++) {
          const el = outerRefs.current[i];
          if (!el) continue;
          const dist = Math.abs(i - floatIndex);
          const offset = (i - floatIndex) * cardStep;
          const s = 1 - Math.min(dist, 1) * 0.05;
          const o = Math.max(0, 1 - Math.min(dist, 2) * 0.3);
          el.style.transform = `translateY(${offset.toFixed(1)}px) scale(${s.toFixed(3)})`;
          el.style.opacity = o.toFixed(3);
          el.style.zIndex = String(Math.round(100 - dist * 10));
        }

        // Pass 2 — read actual screen positions and sync WebGL meshes
        for (let i = 0; i < PADDED.length; i++) {
          const el = outerRefs.current[i];
          if (!el) continue;
          const dist = Math.abs(i - floatIndex);

          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2 - window.innerWidth / 2;
          const cy = -(rect.top + rect.height / 2 - vh / 2);

          // Ghost cards: opacity driven purely by lens strength — fully visible
          // when warped at the screen edge, invisible when not
          // Real cards: normal dist-based fade
          const o = Math.max(0, 1 - Math.min(dist, 2) * 0.3);

          const mesh = meshes[i];
          mesh.visible = true;
          mesh.position.set(cx, cy, 0);
          mesh.scale.set(rect.width / CARD_W, rect.height / CARD_H, 1);
          const u = (mesh.material as THREE.ShaderMaterial).uniforms;
          u.uOpacity.value = o;
          u.uDistFromCenter.value = cy / (vh / 2);
        }

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
      return () => { cancelAnimationFrame(rafId); lenis.destroy(); renderer.dispose(); };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  return (
    <div ref={pageRef} style={{ background: currentTheme.bg }}>

      <canvas
        ref={canvasRef}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
      />

      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}>

        {/* Card carousel */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: CARD_W,
            height: CARD_H,
            overflow: "visible",
          }}
        >
          {/* Left: label + year stacked */}
          <div ref={labelRef} style={{
            position: "absolute",
            right: "calc(100% + 52px)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            pointerEvents: "none",
          }}>
            <span style={{
              fontFamily: "var(--font-sohne), sans-serif",
              fontSize: 15,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: currentTheme.text.primary,
              whiteSpace: "nowrap",
            }}>
              model
            </span>
            <span ref={yearRef} style={{
              fontFamily: "var(--font-sohne), sans-serif",
              fontSize: 13,
              letterSpacing: "0.08em",
              color: currentTheme.text.muted,
              whiteSpace: "nowrap",
            }}>
              {CARDS[0].label}
            </span>
          </div>

          {/* Right model name */}
          <div ref={titleRef} style={{
            position: "absolute",
            left: "calc(100% + 52px)",
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--font-canela), serif",
            fontSize: 32,
            fontWeight: 400,
            color: CARDS[0].color,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            transition: "color 0.5s ease",
          }}>
            {CARDS[0].title}
          </div>

          {PADDED.map((card, i) => {
            const initDist = Math.abs(i - PADDING);
            const initScale = 1 - Math.min(initDist, 1) * 0.05;
            const initOpacity = Math.max(0, 1 - Math.min(initDist, 2) * 0.3);
            const initOffset = (i - PADDING) * INIT_CARD_STEP;
            const initFocused = initDist < 0.5;

            return (
              <div
                key={i}
                ref={(el) => { outerRefs.current[i] = el; }}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `translateY(${initOffset}px) scale(${initScale})`,
                  opacity: initOpacity,
                  zIndex: Math.round(100 - initDist * 10),
                  willChange: "transform, opacity",
                }}
              >
                <div
                  ref={(el) => { innerRefs.current[i] = el; }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${initFocused ? currentTheme.border : currentTheme.borderSubtle}`,
                    boxShadow: initFocused
                      ? "0 12px 40px rgba(0,0,0,0.18)"
                      : "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  <Image
                    src={card.src}
                    alt=""
                    fill
                    style={{ objectFit: "cover", visibility: "hidden" }}
                    priority={i === PADDING}
                  />
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
}
