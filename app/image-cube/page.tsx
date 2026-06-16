"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { motion } from "framer-motion";
import Lenis from "lenis";
import * as THREE from "three";

const SCROLL_PER_ROT = 6000;
const SWIPE_THRESHOLD = 60;

const CATEGORIES = [
  { label: "Brutalist", images: [1,2,3,4,5,6].map(i => `/image-cube/brutalist/brutalist-${i}.png`) },
  { label: "Bauhaus",   images: [1,2,3,4,5,6].map(i => `/image-cube/bauhaus/bauhaus-${i}.png`)     },
  { label: "Art Deco",  images: [1,2,3,4,5,6].map(i => `/image-cube/art-deco/art-deco-${i}.png`)   },
  { label: "Modernist", images: [1,2,3,4,5,6].map(i => `/image-cube/modernist/modernist-${i}.png`) },
  { label: "Gothic",    images: [1,2,3,4,5,6].map(i => `/image-cube/gothic/gothic-${i}.png`)       },
];

const ALL_IMAGES = CATEGORIES.flatMap(c => c.images);

type DragState = {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  dx: number;
};

const CARD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  void main() {
    vUv       = uv;
    vNorm     = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CARD_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNorm;
  varying vec3 vWorldPos;

  uniform sampler2D map;
  uniform sampler2D mapNext;
  uniform float     blend;

  void main() {
    vec3 n      = normalize(vNorm);
    vec3 v      = normalize(cameraPosition - vWorldPos);
    float NdotV = max(dot(n, v), 0.0);

    vec3 img = mix(
      texture2D(map,     vUv).rgb,
      texture2D(mapNext, vUv).rgb,
      blend
    );

    vec3  lightDir = normalize(vec3(0.55, 0.90, 0.60));
    float diffuse  = max(dot(n, lightDir), 0.0);
    float light    = 0.80 + diffuse * 0.28;

    vec3  h    = normalize(lightDir + v);
    float spec = pow(max(dot(n, h), 0.0), 90.0) * 0.65;

    float fresnel = pow(1.0 - NdotV, 2.1);

    float d     = 1.0 - NdotV;
    vec3  irid1 = 0.5 + 0.5 * cos(6.2832 * (d * 2.0 + vec3(0.00, 0.33, 0.67)));
    vec3  irid2 = 0.5 + 0.5 * cos(6.2832 * (d * 4.2 + vec3(0.15, 0.48, 0.82)));
    vec3  irid  = mix(irid1, irid2, 0.4);

    vec3  r    = reflect(-v, n);
    float envY = r.y * 0.5 + 0.5;
    vec3  env  = mix(vec3(0.08, 0.07, 0.12), vec3(0.88, 0.91, 1.00), envY);

    vec2  uv2 = vUv * 2.0 - 1.0;
    float vig = 1.0 - dot(uv2, uv2) * 0.07;

    vec3 color = img * light * vig;
    color += spec * vec3(1.00, 0.97, 0.94);
    color  = mix(color, env, fresnel * 0.18);
    color += irid * fresnel * 0.20;

    float cr    = 0.07;
    vec2  cq    = abs(vUv - 0.5) - (0.5 - cr);
    float cdist = length(max(cq, 0.0)) - cr;
    float alpha = 1.0 - smoothstep(-0.004, 0.004, cdist);

    gl_FragColor = vec4(color, alpha);
  }
`;

// module-level scratch objects — avoid allocating every frame
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);
const _qX    = new THREE.Quaternion();
const _qY    = new THREE.Quaternion();

function Cube({
  activeCategory,
  smoothScroll,
  drag,
}: {
  activeCategory: number;
  smoothScroll: React.RefObject<number>;
  drag: React.RefObject<DragState>;
}) {
  const groupRef      = useRef<THREE.Group>(null);
  const rotY          = useRef(-0.38);
  const dragToY       = useRef(0);
  const dragRotY      = useRef(0);
  const dragVel       = useRef(0);
  const rotX          = useRef(-0.24);
  const spinFrom      = useRef(-0.24);
  const spinTo        = useRef(-0.24 + Math.PI * 2);
  const spinProg      = useRef(999);
  const currentCat    = useRef(activeCategory);
  const blendProgress = useRef(0);
  const isBlending    = useRef(false);

  const textures = useTexture(ALL_IMAGES, (loaded) => {
    (Array.isArray(loaded) ? loaded : [loaded]).forEach(t => {
      t.anisotropy = 8; t.needsUpdate = true;
    });
  });

  const materials = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) =>
      new THREE.ShaderMaterial({
        uniforms: {
          map:     { value: textures[i] },
          mapNext: { value: textures[i] },
          blend:   { value: 0 },
        },
        vertexShader:   CARD_VERT,
        fragmentShader: CARD_FRAG,
        side: THREE.FrontSide,
        transparent: true,
      })
    );
  }, [textures]);

  useEffect(() => {
    return () => { materials.forEach(m => m.dispose()); };
  }, [materials]);

  useEffect(() => {
    if (activeCategory === currentCat.current) return;
    materials.forEach((mat, i) => {
      mat.uniforms.mapNext.value = textures[activeCategory * 6 + i];
      mat.uniforms.blend.value   = 0;
    });
    blendProgress.current = 0;
    isBlending.current    = true;
    spinFrom.current      = rotX.current;
    spinTo.current        = rotX.current + Math.PI * 2;
    spinProg.current      = 0;
  }, [activeCategory, materials, textures]);

  useFrame((_, delta) => {
    // crossfade blend
    if (isBlending.current) {
      blendProgress.current = Math.min(blendProgress.current + delta * 1.8, 1);
      const t = blendProgress.current;
      materials.forEach(mat => { mat.uniforms.blend.value = t * t * (3 - 2 * t); });
      if (blendProgress.current >= 1) {
        materials.forEach((mat, i) => {
          mat.uniforms.map.value   = textures[activeCategory * 6 + i];
          mat.uniforms.blend.value = 0;
        });
        currentCat.current    = activeCategory;
        isBlending.current    = false;
        blendProgress.current = 0;
      }
    }

    // scroll-driven Y rotation
    const targetY = -0.38 + (smoothScroll.current / SCROLL_PER_ROT) * Math.PI * 2;
    rotY.current += (targetY - rotY.current) * 0.12;

    // left/right drag → Y rotation (direct, lerp only on coast)
    if (drag.current.isDragging) {
      dragRotY.current += drag.current.dx;
      dragToY.current   = dragRotY.current;
      dragVel.current   = drag.current.dx;
      drag.current.dx   = 0;
    } else {
      dragVel.current  *= Math.pow(0.88, delta * 60);
      dragToY.current  += dragVel.current;
      dragRotY.current += (dragToY.current - dragRotY.current) * 0.12;
      if (Math.abs(dragVel.current) < 0.00005) dragVel.current = 0;
      drag.current.dx = 0;
    }

    // X spin animation on category change
    if (spinProg.current < 999) {
      spinProg.current += delta;
      const t = spinProg.current;
      const SPIN_DUR = 0.90, SETTLE_AMP = 0.10, SETTLE_ZETA = 0.36, SETTLE_OMEGA = 8.0;
      if (t < SPIN_DUR) {
        const eased = 1 - Math.pow(1 - t / SPIN_DUR, 3);
        rotX.current = spinFrom.current + (spinTo.current + SETTLE_AMP - spinFrom.current) * eased;
      } else {
        const ts     = t - SPIN_DUR;
        const omegaD = SETTLE_OMEGA * Math.sqrt(1 - SETTLE_ZETA * SETTLE_ZETA);
        const osc    = SETTLE_AMP * Math.exp(-SETTLE_ZETA * SETTLE_OMEGA * ts) * Math.cos(omegaD * ts);
        rotX.current = spinTo.current + osc;
        if (Math.abs(osc) < 0.00008) spinProg.current = 999;
      }
    }

    if (groupRef.current) {
      _qX.setFromAxisAngle(_axisX, rotX.current);
      _qY.setFromAxisAngle(_axisY, rotY.current + dragRotY.current);
      groupRef.current.quaternion.multiplyQuaternions(_qY, _qX);
    }
  });

  const S = 0.85;
  const P = 1.60;

  return (
    <group ref={groupRef}>
      <mesh position={[S, 0, 0]}  rotation={[0,  Math.PI / 2, 0]} material={materials[0]}><planeGeometry args={[P, P]} /></mesh>
      <mesh position={[-S, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials[1]}><planeGeometry args={[P, P]} /></mesh>
      <mesh position={[0, S, 0]}  rotation={[-Math.PI / 2, 0, 0]} material={materials[2]}><planeGeometry args={[P, P]} /></mesh>
      <mesh position={[0, -S, 0]} rotation={[Math.PI / 2,  0, 0]} material={materials[3]}><planeGeometry args={[P, P]} /></mesh>
      <mesh position={[0, 0, S]}                                   material={materials[4]}><planeGeometry args={[P, P]} /></mesh>
      <mesh position={[0, 0, -S]} rotation={[0,  Math.PI,   Math.PI]} material={materials[5]}><planeGeometry args={[P, P]} /></mesh>
    </group>
  );
}

export default function ImageCubePage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const smoothScroll = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const setCursor = (value: string) => {
    if (containerRef.current) containerRef.current.style.cursor = value;
  };
  const drag = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    dx: 0,
  });

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    lenis.on("scroll", (e: { scroll: number }) => {
      smoothScroll.current = e.scroll;
    });
    let rafId: number;
    function loop(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current.isDragging = true;
    drag.current.startX     = e.clientX;
    drag.current.startY     = e.clientY;
    drag.current.lastX      = e.clientX;
    drag.current.dx         = 0;
    setCursor("grabbing");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.isDragging) return;
    drag.current.dx   += (e.clientX - drag.current.lastX) * 0.009;
    drag.current.lastX = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.isDragging) return;
    drag.current.isDragging = false;
    setCursor("grab");
    const totalDy = e.clientY - drag.current.startY;
    if (Math.abs(totalDy) > SWIPE_THRESHOLD) {
      setActiveCategory(prev =>
        totalDy < 0
          ? (prev + 1) % CATEGORIES.length
          : (prev - 1 + CATEGORIES.length) % CATEGORIES.length
      );
    }
  };

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={containerRef}
        style={{ position: "fixed", inset: 0, background: "#F4EFE6", cursor: "grab" }}
      >
        <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
          <color attach="background" args={["#F4EFE6"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 4]} intensity={1.0} />
          <Suspense fallback={null}>
            <Cube activeCategory={activeCategory} smoothScroll={smoothScroll} drag={drag} />
          </Suspense>
        </Canvas>

        <div style={{
          position: "absolute", bottom: "14%", left: "50%",
          transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 0,
          cursor: "auto",
        }}>
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              animate={{ color: activeCategory === i ? "#1A1714" : "#9A9A9A" }}
              whileHover={{ color: "#1A1714" }}
              transition={{ color: { duration: 0.2 } }}
              style={{
                position: "relative", background: "none", border: "none", cursor: "pointer",
                padding: "8px 20px", fontFamily: "var(--font-pp-supply-mono), monospace",
                fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", lineHeight: 1,
              }}
            >
              {cat.label}
              <motion.div
                animate={{ scaleX: activeCategory === i ? 1 : 0 }}
                transition={
                  activeCategory === i
                    ? { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                    : { duration: 0.15, ease: "easeIn" }
                }
                style={{
                  position: "absolute", bottom: 0, left: 20, right: 20,
                  height: 1, background: "#1A1714",
                  transformOrigin: "left center", scaleX: 0,
                }}
              />
            </motion.button>
          ))}
        </div>

        <div style={{
          position: "absolute", bottom: 20, right: 24,
          fontFamily: "var(--font-pp-supply-mono), monospace",
          fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#6B6359", lineHeight: 1.7, textAlign: "right", pointerEvents: "none",
        }}>
          Effect.1<br /><span style={{ opacity: 0.5 }}>Drag to Explore</span>
        </div>
      </div>
      <div style={{ height: 50000 }} />
    </>
  );
}
