"use client";

import localFont from "next/font/local";
import { useEffect, useRef } from "react";

const ppRadioGrotesk = localFont({
  src: "./fonts/PPRadioGrotesk-BlackItalic.otf",
  weight: "900",
  style: "italic",
});

const VERT = /* glsl */`
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const LENS_FRAG = /* glsl */`
  uniform sampler2D uText;
  uniform vec2 uMousePx;
  uniform float uTime;
  uniform vec2 uResolution;

  void main() {
    vec2  fragPx = gl_FragCoord.xy;
    vec2  uv     = fragPx / uResolution;
    vec2  toPx   = fragPx - uMousePx;
    float dist   = length(toPx);
    vec2  nDir   = toPx / (dist + 1e-5);
    vec2  tang   = vec2(-nDir.y, nDir.x);

    float infl = exp(-dist * dist / (220.0 * 220.0));

    float w1 = sin(dist * 0.040 - uTime * 2.8);
    float w2 = sin(dist * 0.085 - uTime * 4.2 + 1.6);
    float w3 = sin(dist * 0.060 - uTime * 3.1 + 3.2);

    float radDisp = (w1 * 0.50 + w2 * 0.30 + w3 * 0.20) * 20.0 * infl;
    float tanDisp = sin(dist * 0.05 - uTime * 1.9 + atan(toPx.y, toPx.x) * 0.5)
                  * 9.0 * infl;
    vec2 offset = (nDir * radDisp + tang * tanDisp) / uResolution;

    vec2  ca = nDir * infl * 3.2 / uResolution;
    float r  = texture2D(uText, clamp(uv + offset + ca, vec2(0.0), vec2(1.0))).r;
    float g  = texture2D(uText, clamp(uv + offset,      vec2(0.0), vec2(1.0))).g;
    float b  = texture2D(uText, clamp(uv + offset - ca, vec2(0.0), vec2(1.0))).b;

    vec4  s     = texture2D(uText, clamp(uv + offset, vec2(0.0), vec2(1.0)));
    float luma  = dot(s.rgb, vec3(0.299, 0.587, 0.114));
    float textM = smoothstep(0.20, 0.45, luma);

    float phase = w1 * 0.5 + 0.5;
    vec3  tint  = mix(vec3(0.45, 0.20, 1.10), vec3(1.10, 0.65, 0.15), phase);
    vec3  col   = vec3(r, g, b);
    col = mix(col, col * tint * 1.35, textM * infl * 0.80);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

const GRAIN_FRAG = /* glsl */`
  uniform float uTime;
  uniform vec2  uResolution;

  float rand(vec2 p, float seed) {
    return fract(sin(dot(vec3(p, seed), vec3(12.9898, 4.1414, 78.233))) * 43758.5453);
  }

  void main() {
    vec2  px    = floor(gl_FragCoord.xy);
    float frame = floor(uTime * 18.0);
    float luma  = rand(px, frame) * 0.4;
    float r     = mix(luma, rand(px, frame * 1.7 + 13.3), 0.85);
    float g     = mix(luma, rand(px, frame * 2.3 + 7.1),  0.75);
    float b     = mix(luma, rand(px, frame * 3.1 + 29.7), 0.30);
    float a     = rand(px, frame * 0.211) * 0.55 + 0.15;
    gl_FragColor = vec4(r, g, b, a);
  }
`;

async function getFontUrl(): Promise<string> {
  await document.fonts.ready;
  const primaryFamily = ppRadioGrotesk.style.fontFamily
    .split(",")[0].trim().replace(/['"]/g, "");

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules ?? [])) {
        if (!(rule instanceof CSSFontFaceRule)) continue;
        const family = rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim();
        const src    = rule.style.getPropertyValue("src");
        if (family !== primaryFamily && !src.toLowerCase().includes("ppradiogrotesk")) continue;
        const m = src.match(/url\(["']?([^"')]+)["']?\)/);
        if (m) return m[1];
      }
    } catch { /* cross-origin */ }
  }
  for (const el of Array.from(document.querySelectorAll("style"))) {
    const text = el.textContent ?? "";
    for (const [, block] of text.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
      if (!block.includes(primaryFamily) && !block.toLowerCase().includes("ppradiogrotesk")) continue;
      const m = block.match(/url\(["']?([^"')]+)["']?\)/);
      if (m) return m[1];
    }
  }
  throw new Error(`Font URL not found. Family: "${primaryFamily}"`);
}

// Parse the font with opentype.js, apply dlig GSUB substitutions manually,
// then draw each glyph individually so the ligature is always honoured.
async function bakeTextToCanvas(fontUrl: string, W: number, H: number, fontSize: number): Promise<HTMLCanvasElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opentype = await import("opentype.js") as any;
  const buf  = await (await fetch(fontUrl)).arrayBuffer();
  const font = opentype.parse(buf);

  // ── Apply dlig GSUB substitutions ────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glyphs: any[] = font.stringToGlyphs("ssoma");
  const gsub = font.tables.gsub;
  const dligEntry = gsub?.features?.find((f: { tag: string }) => f.tag === "dlig");

  if (dligEntry) {
    for (const lookupIdx of dligEntry.feature.lookupListIndexes) {
      const lookup = gsub.lookups[lookupIdx];
      if (lookup.lookupType !== 4) continue; // only Ligature Substitution

      for (const sub of lookup.subtables) {
        let i = 0;
        while (i < glyphs.length) {
          const coverageIdx = (sub.coverage.glyphs ?? []).indexOf(glyphs[i].index);
          if (coverageIdx < 0) { i++; continue; }

          let substituted = false;
          for (const lig of sub.ligatureSets[coverageIdx] ?? []) {
            const { ligGlyph, components } = lig;
            if (i + components.length >= glyphs.length) continue;
            const match = components.every(
              (c: number, j: number) => glyphs[i + 1 + j].index === c
            );
            if (match) {
              glyphs[i] = font.glyphs.get(ligGlyph);
              glyphs.splice(i + 1, components.length);
              substituted = true;
              break;
            }
          }
          if (!substituted) i++;
        }
      }
    }
  }

  // ── Calculate layout ─────────────────────────────────────────────
  const scale          = fontSize / font.unitsPerEm;
  const letterSpacingPx = -0.04 * fontSize;

  let totalWidth = 0;
  for (let i = 0; i < glyphs.length; i++) {
    totalWidth += glyphs[i].advanceWidth * scale;
    if (i < glyphs.length - 1) {
      totalWidth += letterSpacingPx;
      totalWidth += font.getKerningValue(glyphs[i], glyphs[i + 1]) * scale;
    }
  }

  const startX    = (W - totalWidth) / 2;
  const ascenderPx  = font.ascender  * scale;
  const descenderPx = font.descender * scale; // negative
  const baselineY = H / 2 - (ascenderPx + descenderPx) / 2;

  // ── Draw ─────────────────────────────────────────────────────────
  const textCanvas = document.createElement("canvas");
  textCanvas.width  = W;
  textCanvas.height = H;
  const ctx = textCanvas.getContext("2d")!;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, W, H);

  let x = startX;
  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const glyphPath = glyph.getPath(x, baselineY, fontSize);
    glyphPath.fill = "#e0e0e0";
    glyphPath.draw(ctx);

    let advance = glyph.advanceWidth * scale + letterSpacingPx;
    if (i < glyphs.length - 1) {
      advance += font.getKerningValue(glyph, glyphs[i + 1]) * scale;
    }
    x += advance;
  }

  return textCanvas;
}

export default function FontFlare() {
  const lensCanvasRef  = useRef<HTMLCanvasElement>(null);
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef      = useRef<HTMLDivElement>(null);
  const mouseRef       = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const canvas = lensCanvasRef.current;
    if (!canvas) return;
    let rafId: number;

    async function init() {
      const THREE = await import("three");
      const W = window.innerWidth;
      const H = window.innerHeight;

      await document.fonts.ready;

      const fontUrl    = await getFontUrl();
      const fontSize   = Math.round(W * 0.13);
      const textCanvas = await bakeTextToCanvas(fontUrl, W, H, fontSize);

      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: false, alpha: false });
      renderer.setSize(W, H);
      renderer.setClearColor(0x1a1a1a, 1);

      const scene  = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const texture = new THREE.CanvasTexture(textCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const material = new THREE.ShaderMaterial({
        vertexShader:   VERT,
        fragmentShader: LENS_FRAG,
        uniforms: {
          uText:       { value: texture },
          uMousePx:    { value: new THREE.Vector2(-9999, -9999) },
          uTime:       { value: 0 },
          uResolution: { value: new THREE.Vector2(W, H) },
        },
      });

      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      function raf() {
        material.uniforms.uTime.value += 0.016;
        material.uniforms.uMousePx.value.set(mouseRef.current.x, H - mouseRef.current.y);
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
      return () => { cancelAnimationFrame(rafId); renderer.dispose(); };
    }

    let cleanup: (() => void) | undefined;
    init().then(fn => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  useEffect(() => {
    const canvas = grainCanvasRef.current;
    if (!canvas) return;
    let rafId: number;

    async function init() {
      const THREE = await import("three");
      const W = window.innerWidth;
      const H = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: false, alpha: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);

      const scene  = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const material = new THREE.ShaderMaterial({
        vertexShader:   VERT,
        fragmentShader: GRAIN_FRAG,
        transparent:    true,
        uniforms: {
          uTime:       { value: 0 },
          uResolution: { value: new THREE.Vector2(W, H) },
        },
      });

      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      function raf() {
        material.uniforms.uTime.value += 0.016;
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
      return () => { cancelAnimationFrame(rafId); renderer.dispose(); };
    }

    let cleanup: (() => void) | undefined;
    init().then(fn => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", cursor: "none", overflow: "hidden" }}>
      <style>{`
        @keyframes sonar-pulse {
          0%   { transform: translate(-50%, -50%) scale(0.02); opacity: 0.75; }
          60%  { opacity: 0.35; }
          100% { transform: translate(-50%, -50%) scale(1.00); opacity: 0;    }
        }
      `}</style>

      {/* DOM text — visible while opentype.js loads, covered by opaque canvas once ready */}
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1,
      }}>
        <span
          className={ppRadioGrotesk.className}
          style={{
            fontSize:            "13vw",
            color:               "#e0e0e0",
            lineHeight:          1,
            userSelect:          "none",
            letterSpacing:       "-0.04em",
            fontFeatureSettings: '"dlig" 1',
          }}
        >
          ssoma
        </span>
      </div>

      <canvas
        ref={lensCanvasRef}
        style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 2 }}
      />
      <canvas
        ref={grainCanvasRef}
        style={{
          position: "fixed", top: 0, left: 0, pointerEvents: "none",
          zIndex: 3, mixBlendMode: "overlay",
        }}
      />

      <div
        ref={cursorRef}
        style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 4 }}
      >
        {[0, 0.83, 1.67].map((delay, i) => (
          <div
            key={i}
            style={{
              position: "absolute", top: 0, left: 0,
              width: 340, height: 340,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.55)",
              animation: `sonar-pulse 2.5s ease-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
