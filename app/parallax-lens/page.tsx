"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { Text, useFBO, useTexture } from "@react-three/drei";
import Lenis from "lenis";
import * as THREE from "three";

const MONO = "var(--font-mdui), monospace";
const CARD = 0.72;

const SHARED_BG = "#F0EAE0";

const SECTIONS = [
  { title: "Forest",    folder: "forest",    textColor: "#2B4A24", bg: SHARED_BG   },
  { title: "Grassland", folder: "grassland", textColor: "#7A9A6A", bg: SHARED_BG   },
  { title: "Desert",    folder: "desert",    textColor: "#8B6535", bg: SHARED_BG   },
  { title: "Ocean",     folder: "ocean",     textColor: "#4A8EC4", bg: SHARED_BG   },
  { title: "Tundra",    folder: "tundra",    textColor: "#E2E8ED", bg: "#111111"   },
];

const SECTION_PX = 6000;

const CARD_GEO = typeof window !== "undefined"
  ? new THREE.CircleGeometry(CARD / 2, 128)
  : null;

// ---- Glass ball shader ----
const vertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec4 vClip;
  void main() {
    vUv  = uv;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vClip = p;
    gl_Position = p;
  }
`;

const fragmentShader = /* glsl */`
  uniform sampler2D photoMap;
  uniform sampler2D bgMap;
  uniform float     uScroll;
  uniform vec3      uBgColor;
  uniform float     uShadow;   // 1.0 = behind text (receive shadow), 0.0 = in front
  varying vec2 vUv;
  varying vec4 vClip;

  const float EDGE_W = 0.16;
  const float PI     = 3.14159265;

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    return fract(sin(dot(p, p + vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 screen = (vClip.xy / vClip.w) * 0.5 + 0.5;
    vec2 p = vUv - 0.5;

    float d            = length(p) - 0.5;
    float distFromEdge = max(0.0, -d);
    float edgeFactor   = 1.0 - smoothstep(0.0, EDGE_W, distFromEdge);
    vec2  grad         = length(p) > 0.001 ? normalize(p) : vec2(0.0, 1.0);
    float ef2          = edgeFactor * edgeFactor;

    float t          = uScroll * 0.0055;
    float lightAngle = PI * 0.5 - t;
    vec2  lightDir   = vec2(cos(lightAngle), sin(lightAngle));
    float litFactor  = max(0.0, dot(grad, lightDir));

    float wx      = sin(vUv.y * PI * 2.0 + t * 1.10) * 0.028;
    float wy      = sin(vUv.x * PI * 2.0 + t * 0.90) * 0.028;
    vec2  warpVec = vec2(wx, wy) * (0.15 + ef2 * 0.85);

    float r2     = dot(p, p);
    float barrel = 1.0 / (1.0 + 2.20 * r2);
    vec2  pUv    = 0.5 - p * barrel + warpVec;
    pUv = clamp(pUv, 0.001, 0.999);

    float caStr  = 0.004 + ef2 * 0.011 + ef2 * litFactor * 0.008;
    float photoR = texture2D(photoMap, clamp(pUv + lightDir * caStr, 0.001, 0.999)).r;
    float photoG = texture2D(photoMap, pUv).g;
    float photoB = texture2D(photoMap, clamp(pUv - lightDir * caStr, 0.001, 0.999)).b;
    vec4  photo  = vec4(photoR, photoG, photoB, 1.0);

    vec2 bgUv  = screen - p * barrel * 0.12 + vec2(wx, wy) * 0.20;
    vec4 bg    = texture2D(bgMap, clamp(bgUv, 0.001, 0.999));
    vec4 color = mix(photo, bg, 0.16 + ef2 * 0.10);

    vec3 glassTint = vec3(0.93, 0.97, 1.00);
    color.rgb = mix(color.rgb, color.rgb * glassTint, edgeFactor * 0.30);
    color.rgb *= 1.0 - edgeFactor * 0.22;
    color.rgb += pow(edgeFactor * litFactor, 2.0) * 0.28;
    color.rgb += smoothstep(0.86, 1.0, edgeFactor) * 0.18;
    color.rgb += (1.0 - edgeFactor) * 0.04;

    // Text shadow: only active for orbs sitting behind the text plane.
    // Compare direct bgMap sample against the plain background — where they
    // differ, text geometry is present and we darken accordingly.
    vec4  bgDirect  = texture2D(bgMap, screen);
    float textDelta = length(bgDirect.rgb - uBgColor);
    float shadow    = smoothstep(0.08, 0.50, textDelta) * 0.28 * uShadow;
    color.rgb      *= 1.0 - shadow;

    // Tactile grain — finer in the clear center, denser at the glass rim
    float grainAmt = 0.018 + edgeFactor * 0.022;
    float grain    = (hash21(vUv * 780.0) * 2.0 - 1.0) * grainAmt;
    color.rgb     += grain;

    gl_FragColor = color;
  }
`;

// ---- Background title — blur dissolve on section change ----
// fillOpacity, outlineOpacity, outlineBlur are all mutated imperatively so
// React re-renders from setDisplayed() don't clobber mid-transition values.
function BgTitle({ section }: { section: number }) {
  const { viewport } = useThree();
  const [displayed, setDisplayed] = useState(section);
  const phase  = useRef<'idle' | 'out' | 'in'>('idle');
  const target = useRef(section);
  const op     = useRef(1);
  const ref    = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.fillOpacity    = 1;
    ref.current.outlineOpacity = 0;
    ref.current.outlineBlur    = 0;
  }, []);

  useEffect(() => {
    if (section !== target.current) {
      target.current = section;
      phase.current  = 'out';
    }
  }, [section]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (phase.current === 'out') {
      op.current = Math.max(0, op.current - dt * 3.0);
      ref.current.fillOpacity = op.current;
      ref.current.outlineBlur = (1 - op.current) * 0.12;
      if (op.current <= 0) {
        setDisplayed(target.current);
        phase.current = 'in';
      }
    } else if (phase.current === 'in') {
      op.current = Math.min(1, op.current + dt * 2.2);
      ref.current.fillOpacity = op.current;
      ref.current.outlineBlur = (1 - op.current) * 0.12;
      if (op.current >= 1) {
        ref.current.outlineBlur = 0;
        phase.current = 'idle';
      }
    }
  });

  const s    = SECTIONS[displayed % SECTIONS.length];
  const labelSize  = viewport.width * 0.006;
  const labelY     = viewport.width * 0.115;
  const underlineW = labelSize * 6.2;
  const underlineH = labelSize * 0.09;

  return (
    <>
      <Text
        font="/fonts/MDUITrial-Regular.otf"
        fontSize={labelSize}
        color={s.textColor}
        letterSpacing={0.20}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, labelY, 0]}
        sdfGlyphSize={128}
      >
        BIOME
      </Text>
      <mesh position={[0, labelY - labelSize * 1.1, 0]}>
        <planeGeometry args={[underlineW, underlineH]} />
        <meshBasicMaterial color={s.textColor} />
      </mesh>
      <Text
        ref={ref}
        font="/fonts/PPEditorialOld-Ultralight.otf"
        fontSize={viewport.width * 0.19}
        color={s.textColor}
        outlineColor={s.textColor}
        letterSpacing={-0.04}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0]}
        sdfGlyphSize={256}
      >
        {s.title}
      </Text>
    </>
  );
}

// ---- Shared orb loop ----
function useOrbLoop(startY: number, parallaxRate: number, scrollY: React.RefObject<number>) {
  const loopOffset  = useRef(0);
  const { viewport } = useThree();
  return () => {
    const vhRatio = viewport.height / window.innerHeight;
    let y = startY + scrollY.current * vhRatio * parallaxRate + loopOffset.current;
    while (y >  3.2) { loopOffset.current -= 9.0; y -= 9.0; }
    while (y < -5.8) { loopOffset.current += 9.0; y += 9.0; }
    return y;
  };
}

// ---- Glass card ----
function GlassCard({
  cardIndex, orbScale, shadow, x, startY, parallaxRate, z,
  scrollY, bgMap, sectionRef, bgColorRef,
}: {
  cardIndex: number; orbScale: number; shadow: boolean;
  x: number; startY: number; parallaxRate: number; z: number;
  scrollY: React.RefObject<number>; bgMap: THREE.Texture;
  sectionRef: React.RefObject<number>; bgColorRef: React.RefObject<THREE.Color>;
}) {
  const ref  = useRef<THREE.Mesh>(null);
  const getY = useOrbLoop(startY, parallaxRate, scrollY);

  const textures = useTexture(
    SECTIONS.map(s => `/parallax-lens/${s.folder}/img-${cardIndex}.jpg`)
  );

  const uniforms = useMemo(() => ({
    photoMap: { value: textures[0] },
    bgMap:    { value: bgMap },
    uScroll:  { value: 0 },
    uBgColor: { value: new THREE.Color(SECTIONS[0].bg) },
    uShadow:  { value: shadow ? 1.0 : 0.0 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.ShaderMaterial;
    mat.uniforms.bgMap.value    = bgMap;
    mat.uniforms.photoMap.value = textures[sectionRef.current % SECTIONS.length];
    mat.uniforms.uScroll.value  = scrollY.current;
    mat.uniforms.uBgColor.value.copy(bgColorRef.current);
    ref.current.position.y      = getY();
  });

  if (!CARD_GEO) return null;
  return (
    <mesh ref={ref} position={[x, startY, z]} geometry={CARD_GEO} scale={[orbScale, orbScale, 1]}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

// ---- Scene ----
function Scene({ scrollY, section, sectionRef }: {
  scrollY: React.RefObject<number>;
  section: number;
  sectionRef: React.RefObject<number>;
}) {
  const { gl, camera, size, scene } = useThree();

  const bgScene = useMemo(() => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(SECTIONS[0].bg);
    return s;
  }, []);

  const fbo        = useFBO(size.width, size.height);
  const targetBg   = useRef(new THREE.Color(SECTIONS[0].bg));
  const bgColorRef = useRef(new THREE.Color(SECTIONS[0].bg));

  useEffect(() => { scene.background = new THREE.Color(SECTIONS[0].bg); }, [scene]);
  useEffect(() => { targetBg.current.set(SECTIONS[section % SECTIONS.length].bg); }, [section]);

  useFrame(() => {
    if (bgScene.background instanceof THREE.Color) {
      bgScene.background.lerp(targetBg.current, 0.04);
      bgColorRef.current.copy(bgScene.background);
    }
    if (scene.background instanceof THREE.Color)
      scene.background.lerp(targetBg.current, 0.04);
    gl.setRenderTarget(fbo);
    gl.render(bgScene, camera);
    gl.setRenderTarget(null);
  });

  const card = (cardIndex: number, orbScale: number, shadow: boolean, x: number, startY: number, parallaxRate: number, z: number) => (
    <GlassCard
      key={`${cardIndex}-${x}-${z}`}
      cardIndex={cardIndex} orbScale={orbScale} shadow={shadow}
      x={x} startY={startY} parallaxRate={parallaxRate} z={z}
      scrollY={scrollY} bgMap={fbo.texture}
      sectionRef={sectionRef} bgColorRef={bgColorRef}
    />
  );

  return (
    <>
      {createPortal(<BgTitle section={section} />, bgScene)}
      <BgTitle section={section} />

      {/* Small — behind text, receive text shadow */}
      {card(1, 0.44, true,  -0.56,  1.0,  0.52, -0.4)}
      {card(3, 0.50, true,   0.44,  0.0,  0.60, -0.4)}
      {card(5, 0.36, true,   0.08,  1.8,  0.56, -0.4)}

      {/* Medium — in front, refraction only */}
      {card(2, 0.80, false, -0.42, -1.2,  0.46,  0.3)}
      {card(4, 0.76, false,  0.54, -3.2,  0.66,  0.3)}

      {/* Large — in front, full glass */}
      {card(6, 1.14, false, -0.20, -2.2,  0.42,  0.65)}
      {card(7, 1.08, false,  0.34, -4.8,  0.71,  0.65)}
    </>
  );
}

// ---- Page ----
export default function ParallaxLens() {
  const scrollY    = useRef(0);
  const sectionRef = useRef(0);
  const [section, setSection] = useState(0);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.055 });
    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      scrollY.current = scroll;
      const s = Math.floor(scroll / SECTION_PX) % SECTIONS.length;
      if (s !== sectionRef.current) { sectionRef.current = s; setSection(s); }
    });
    let id: number;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);

  const s = SECTIONS[section % SECTIONS.length];

  return (
    <>
      <div style={{ height: "6000vh" }} />
      <Canvas
        style={{ position: "fixed", inset: 0, top: 0, pointerEvents: "none" }}
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Scene scrollY={scrollY} section={section} sectionRef={sectionRef} />
      </Canvas>
      <div style={{
        position: "fixed", top: 20, right: 24, zIndex: 10,
        fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em",
        textTransform: "uppercase", color: s.textColor,
        lineHeight: 1.7, textAlign: "right", pointerEvents: "none",
        transition: "color 1.2s ease",
      }}>
        NATURE.1<br />PARALLAX LENS<br />
        <span style={{ opacity: 0.5 }}>{s.title}</span>
      </div>
    </>
  );
}
