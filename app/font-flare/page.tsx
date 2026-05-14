"use client";

import localFont from "next/font/local";
import { useEffect, useRef } from "react";
import symbolImg from "./symbol.png";

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

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i),             f - vec2(0,0)),
          dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
          dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = rot * p; a *= 0.5; }
    return v;
  }

  uniform float uLensStr;

  void main() {
    vec2  fragPx = gl_FragCoord.xy;
    vec2  uv     = fragPx / uResolution;
    vec2  toPx   = fragPx - uMousePx;
    float dist   = length(toPx);
    // Clamp to avoid direction instability when dist → 0
    vec2  nDir   = toPx / max(dist, 4.0);
    vec2  tang   = vec2(-nDir.y, nDir.x);
    float angle  = atan(toPx.y, toPx.x);

    // Gaussian falloff: smooth top, no hard edge
    float infl = exp(-dist * dist / (230.0 * 230.0));

    // Fade radial/tangential terms out near the cursor center so
    // the unstable nDir direction doesn't create choppy artefacts there
    float radialFade = smoothstep(0.0, 60.0, dist);

    // Angular variation breaks circular symmetry (reduced amplitude for smoother look)
    float angVar = sin(angle * 3.0 + uTime * 0.55) * 0.28
                 + cos(angle * 5.0 + uTime * 0.38) * 0.16;

    float w1 = sin(dist * 0.038 - uTime * 2.6 + angVar);
    float w2 = sin(dist * 0.070 - uTime * 3.8 + angVar * 1.9 + 1.4);
    float w3 = sin(dist * 0.052 - uTime * 2.1 + angVar * 2.5 + 2.9);

    float radDisp = (w1 * 0.50 + w2 * 0.30 + w3 * 0.20) * 22.0 * infl * radialFade;
    float tanDisp = (sin(dist * 0.044 - uTime * 1.8 + angle * 1.0) * 0.6
                   + sin(dist * 0.028 - uTime * 1.2 + angle * 2.0 + 1.1) * 0.4)
                   * 11.0 * infl * radialFade;

    // fBm flow field — viewport-based so it's stable at any dist
    vec2 fc  = fragPx * 0.005;
    float nx = fbm(fc + vec2(uTime * 0.10,  uTime * 0.07));
    float ny = fbm(fc + vec2(uTime * 0.07, -uTime * 0.11) + vec2(3.7, 1.9));
    vec2 flowOffset = vec2(nx, ny) * 14.0 * infl;

    // uLensStr drives the spring settle — slight negative overshoot = brief counter-warp
    vec2 offset = ((nDir * radDisp + tang * tanDisp) / uResolution
                + flowOffset / uResolution) * uLensStr;

    // CA and tinting use a non-negative version so they only fade, not invert
    float lensA = clamp(uLensStr, 0.0, 1.5);
    vec2  ca = nDir * infl * lensA * 3.5 / uResolution;
    float r  = texture2D(uText, clamp(uv + offset + ca, vec2(0.0), vec2(1.0))).r;
    float g  = texture2D(uText, clamp(uv + offset,      vec2(0.0), vec2(1.0))).g;
    float b  = texture2D(uText, clamp(uv + offset - ca, vec2(0.0), vec2(1.0))).b;

    vec4  s     = texture2D(uText, clamp(uv + offset, vec2(0.0), vec2(1.0)));
    float luma  = dot(s.rgb, vec3(0.299, 0.587, 0.114));
    float textM = smoothstep(0.20, 0.45, luma);

    float phase = w1 * 0.5 + 0.5;
    vec3  tint  = mix(vec3(0.45, 0.20, 1.10), vec3(1.10, 0.65, 0.15), phase);
    vec3  col   = vec3(r, g, b);
    col = mix(col, col * tint * 1.35, textM * infl * lensA * 0.80);

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
    // Real film: red grain is coarser, blue grain is finest
    vec2  pxR   = floor(gl_FragCoord.xy / 2.8);
    vec2  pxG   = floor(gl_FragCoord.xy / 1.6);
    vec2  pxB   = floor(gl_FragCoord.xy / 1.0);
    float frame = floor(uTime * 8.0);
    float luma  = rand(pxG, frame) * 0.20;
    // Warm Kodachrome bias: r boosted, b pulled back
    float r     = mix(luma, rand(pxR, frame * 1.7 + 13.3), 0.94) * 1.00;
    float g     = mix(luma, rand(pxG, frame * 2.3 + 7.1),  0.86) * 0.82;
    float b     = mix(luma, rand(pxB, frame * 3.1 + 29.7), 0.70) * 0.52;
    float a     = rand(pxG, frame * 0.211) * 0.40 + 0.12;
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
async function bakeTextToCanvas(fontUrl: string, symbolUrl: string, W: number, H: number, fontSize: number, dpr: number): Promise<HTMLCanvasElement> {
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
  textCanvas.width  = Math.round(W * dpr);
  textCanvas.height = Math.round(H * dpr);
  const ctx = textCanvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, W, H);

  let x = startX;
  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const glyphPath = glyph.getPath(x, baselineY, fontSize);
    glyphPath.fill = "#e8d9bf";
    glyphPath.draw(ctx);

    let advance = glyph.advanceWidth * scale + letterSpacingPx;
    if (i < glyphs.length - 1) {
      advance += font.getKerningValue(glyph, glyphs[i + 1]) * scale;
    }
    x += advance;
  }

  // ── Draw symbol above text ───────────────────────────────────────
  const S    = Math.min(W, H);
  const symX = W / 2;
  const symY = H / 2 - S * 0.16;
  await new Promise<void>((resolve) => {
    const img = new window.Image() as HTMLImageElement;
    img.onload = () => {
      const targetW = Math.round(W * 0.044);
      const targetH = Math.round(targetW * (img.naturalHeight / img.naturalWidth));
      ctx.drawImage(img, symX - targetW / 2, symY - targetH / 2, targetW, targetH);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = symbolUrl;
  });

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
    const leave = () => { mouseRef.current = { x: -999, y: -999 }; };
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
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

      const dpr        = window.devicePixelRatio || 1;
      const S          = Math.min(W, H);
      const fontUrl    = await getFontUrl();
      const fontSize   = Math.round(S * 0.13);
      const textCanvas = await bakeTextToCanvas(fontUrl, symbolImg.src, W, H, fontSize, dpr);

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
          uLensStr:    { value: 0 },
        },
      });

      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      // Spring lens position: lags behind real cursor so distortion fades
      // gradually as cursor moves away, with a slight bounce on settle.
      const lens = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
      const str  = { val: 0, vel: 0 };

      function raf() {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const active = mx > 0;

        const tx = active ? mx : W / 2;
        const ty = active ? my : H / 2;

        // Two-stage smoothing: ease velocity toward desired, then apply.
        // Gives a soft-start / long-coast / soft-stop — heavy, viscous weight.
        const desiredVx = (tx - lens.x) * 0.032;
        const desiredVy = (ty - lens.y) * 0.032;
        lens.vx += (desiredVx - lens.vx) * 0.055;
        lens.vy += (desiredVy - lens.vy) * 0.055;
        lens.x  += lens.vx;
        lens.y  += lens.vy;

        // Strength spring handles page-enter / page-leave fade (overshoot = counter-warp)
        str.vel += ((active ? 1.0 : 0.0) - str.val) * 0.04;
        str.vel *= 0.88;
        str.val += str.vel;

        material.uniforms.uLensStr.value = str.val;
        material.uniforms.uTime.value += 0.016;
        material.uniforms.uMousePx.value.set(lens.x, H - lens.y);
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
            fontSize:            "13vmin",
            color:               "#e8d9bf",
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
          zIndex: 4, mixBlendMode: "overlay",
        }}
      />

      {/* Square crop guide for 1:1 screen recording */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vmin", height: "100vmin",
        pointerEvents: "none",
        zIndex: 6,
        boxShadow: "0 0 0 100vmax rgba(0,0,0,0.55)",
      }}>
        {([
          { top: 0,    left: 0,    borderTop: "1px solid rgba(255,255,255,0.35)", borderLeft:   "1px solid rgba(255,255,255,0.35)" },
          { top: 0,    right: 0,   borderTop: "1px solid rgba(255,255,255,0.35)", borderRight:  "1px solid rgba(255,255,255,0.35)" },
          { bottom: 0, left: 0,    borderBottom: "1px solid rgba(255,255,255,0.35)", borderLeft:  "1px solid rgba(255,255,255,0.35)" },
          { bottom: 0, right: 0,   borderBottom: "1px solid rgba(255,255,255,0.35)", borderRight: "1px solid rgba(255,255,255,0.35)" },
        ] as React.CSSProperties[]).map((style, i) => (
          <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style }} />
        ))}
      </div>

      <div
        ref={cursorRef}
        style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 5 }}
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
