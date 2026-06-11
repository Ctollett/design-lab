"use client"

import { useState, useEffect, useRef } from "react"
import type * as THREE from "three"
import Lenis from "lenis"
import { motion, useMotionValue } from "framer-motion"

const CARDS = [
  { src: "/card-lift/northwest.png",     location: "Pacific Northwest",   region: "Oregon",          year: "1969" },
  { src: "/card-lift/prarie.png",        location: "Great Plains",        region: "Kansas",          year: "1971" },
  { src: "/card-lift/marsh.png",         location: "Coastal Wetlands",    region: "Louisiana",       year: "1968" },
  { src: "/card-lift/redwood.png",       location: "Redwood Forest",      region: "N. California",   year: "1972" },
  { src: "/card-lift/poppy.png",         location: "Wildflower Fields",   region: "California",      year: "1970" },
  { src: "/card-lift/birch.png",         location: "Birch Forest",        region: "New England",     year: "1972" },
  { src: "/card-lift/canyon.png",        location: "Canyon Country",      region: "Utah",            year: "1970" },
  { src: "/card-lift/coast.png",         location: "Coastal Headland",    region: "N. California",   year: "1968" },
  { src: "/card-lift/desert.png",        location: "High Desert",         region: "Utah",            year: "1970" },
  { src: "/card-lift/glacial-valley.png",location: "Glacial Valley",      region: "Rocky Mountains", year: "1971" },
]

const N               = CARDS.length
const CARD_W          = 260
const CARD_H          = 390
const GAP             = 14
const STRIDE          = CARD_W + GAP
const BUFFER          = 8
const RADIUS          = 18
const SCROLL_PER_CARD = 900
const TOTAL_SCROLL    = 40000
const SCROLL_MID      = TOTAL_SCROLL / 2
const GL_HALF         = 25

// ── Scroll indicator ─────────────────────────────────────────────────────────
// Horizontal adaptation of the ScrollCue from colton-portfolio-2026.
// Mark shape rotated 90°: arms extend vertically, tick caps are horizontal.

const TW   = 560   // track width
const TH   = 28    // svg height
const CY   = TH / 2
const SR   = 9     // circle radius
const ARM  = 11    // arm length
const TICK = 3
const SW   = 1.0
const LX   = SR
const RX   = TW - SR

function IndicatorMark() {
  return (
    <>
      <circle cx={0} cy={CY} r={SR} fill="none" strokeWidth={SW} />
      <line x1={0} y1={CY - ARM} x2={0} y2={CY + ARM} strokeWidth={SW} />
      <line x1={-TICK} y1={CY - ARM} x2={TICK} y2={CY - ARM} strokeWidth={SW} />
      <line x1={-TICK} y1={CY + ARM} x2={TICK} y2={CY + ARM} strokeWidth={SW} />
    </>
  )
}

function ScrollIndicator({ floatRef, totalCards }: {
  floatRef:   { current: number }
  totalCards: number
}) {
  const greyRef   = useRef<SVGGElement>(null)
  const accentRef = useRef<SVGGElement>(null)

  useEffect(() => {
    let markX           = LX
    let amplitude       = 0
    let targetAmplitude = 0
    let rafId: number

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaMode === 0 ? e.deltaY : e.deltaY * 20
      targetAmplitude = Math.min(1, Math.abs(delta) / 80)
    }

    window.addEventListener("wheel", onWheel, { passive: true })

    const tick = () => {
      amplitude       += (targetAmplitude - amplitude) * 0.07
      targetAmplitude *= 0.88

      // Continuous float index, clamped to track bounds
      const fi      = ((floatRef.current % totalCards) + totalCards) % totalCards
      const targetX = LX + (fi / Math.max(totalCards - 1, 1)) * (RX - LX)
      markX        += (targetX - markX) * 0.12
      markX         = Math.max(LX, Math.min(RX, markX))

      const tx = `translate(${markX.toFixed(2)}, 0)`
      if (greyRef.current)   greyRef.current.setAttribute("transform", tx)
      if (accentRef.current) {
        accentRef.current.setAttribute("transform", tx)
        accentRef.current.style.opacity = amplitude.toFixed(3)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener("wheel", onWheel) }
  }, [floatRef, totalCards])

  return (
    <svg width={TW} height={TH} viewBox={`0 0 ${TW} ${TH}`} overflow="visible" style={{ display: "block" }}>
      {/* Track */}
      <line x1={0} y1={CY} x2={TW} y2={CY} stroke="currentColor" strokeWidth={SW} opacity={0.2} />
      <line x1={0} y1={CY - TICK} x2={0} y2={CY + TICK} stroke="currentColor" strokeWidth={SW} opacity={0.2} />
      <line x1={TW} y1={CY - TICK} x2={TW} y2={CY + TICK} stroke="currentColor" strokeWidth={SW} opacity={0.2} />

      <g ref={greyRef}   transform={`translate(${LX}, 0)`} stroke="#888884" opacity={0.55} fill="none"><IndicatorMark /></g>
      <g ref={accentRef} transform={`translate(${LX}, 0)`} stroke="#B54A2A" opacity={0}    fill="none"><IndicatorMark /></g>
    </svg>
  )
}

// ── Shaders ───────────────────────────────────────────────────────────────────

// Cloth/mesh flex — top of card has more inertia, bends naturally with scroll
const VERT = /* glsl */`
  varying vec2  vUv;
  uniform float uVelocity;   // signed, normalised –1 … +1

  const float HW = ${CARD_W / 2}.0;
  const float HH = ${CARD_H / 2}.0;

  void main() {
    vUv = uv;
    vec3  pos = position;
    float nx  = position.x / HW;   // –1 … +1
    float ny  = position.y / HH;   // –1 bottom … +1 top
    float vel = uVelocity;

    // Primary flex: top swings freely, bottom is the anchor
    float topWeight = pow((ny + 1.0) * 0.5, 2.0);
    pos.x += vel * topWeight * HW * 0.72;

    // Secondary bend: cloth sags at the vertical midpoint
    float sagWeight = 1.0 - ny * ny;
    pos.y -= abs(vel) * sagWeight * HH * 0.16;

    // Trailing-edge drag: rear edge bows back
    float trail = max(0.0, -nx * sign(vel + 0.0001));
    pos.x      += vel * trail * trail * HW * 0.28;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG = /* glsl */`
  uniform sampler2D uTexture;
  uniform float     uOpacity;
  varying vec2      vUv;

  const float W = ${CARD_W}.0;
  const float H = ${CARD_H}.0;
  const float R = ${RADIUS}.0;

  void main() {
    vec3 col = texture2D(uTexture, vUv).rgb;

    // Corner rounding
    vec2  px      = vUv * vec2(W, H);
    vec2  nearest = clamp(px, vec2(R), vec2(W - R, H - R));
    float corner  = 1.0 - smoothstep(R - 1.0, R + 1.0, length(px - nearest));

    gl_FragColor = vec4(col, corner * uOpacity);
  }
`

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CardLift() {
  const [mounted, setMounted]             = useState(false)
  const [centerVirtual, setCenterVirtual] = useState(0)

  const wrapperRef    = useRef<HTMLDivElement>(null)
  const floatIndexRef = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const slotRefs   = useRef<Map<number, HTMLDivElement>>(new Map())

  const x = useMotionValue(0)

  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.background
    document.body.style.background = "#F4EFE6"
    return () => { document.body.style.background = prev }
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const content = contentRef.current
    const canvas  = canvasRef.current
    if (!wrapper || !content || !canvas) return

    let disposed  = false
    let doCleanup: (() => void) | null = null

    import("three").then((THREE) => {
      if (disposed) return

      const W = window.innerWidth
      const H = window.innerHeight

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: false, antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace

      const scene  = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 0.1, 100)
      camera.position.z = 1

      const loader   = new THREE.TextureLoader()
      const textures: (THREE.Texture | null)[] = Array(N).fill(null)
      CARDS.forEach((card, i) => {
        loader.load(card.src, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
          textures[i] = tex
        })
      })

      // High-resolution mesh so the cloth flex is smooth
      const geo  = new THREE.PlaneGeometry(CARD_W, CARD_H, 32, 32)
      const pool: { mesh: THREE.Mesh; slot: number; cardIdx: number }[] = []

      for (let slot = -GL_HALF; slot <= GL_HALF; slot++) {
        const cardIdx = ((slot % N) + N) % N
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uTexture:  { value: null },
            uOpacity:  { value: 1 },
            uVelocity: { value: 0 },
          },
          vertexShader:   VERT,
          fragmentShader: FRAG,
          transparent:    true,
          depthWrite:     false,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.visible = false
        scene.add(mesh)
        pool.push({ mesh, slot, cardIdx })
      }

      wrapper.scrollTop = SCROLL_MID
      const lenis = new Lenis({ wrapper, content, smoothWheel: true, lerp: 0.06, wheelMultiplier: 0.25 })

      // Underdamped spring for the display velocity — slight overshoot on stop
      // gives the cloth a natural "ring" as it settles
      let rawVelocity = 0
      let dispVel     = 0   // display velocity (spring position)
      let springVel   = 0   // spring's own velocity

      lenis.on("scroll", ({ scroll, velocity }: { scroll: number; velocity: number }) => {
        rawVelocity = velocity
        const floatIndex = (scroll - SCROLL_MID) / SCROLL_PER_CARD
        floatIndexRef.current = floatIndex
        x.set(-floatIndex * STRIDE)
        setCenterVirtual(prev => {
          const next = Math.round(floatIndex)
          return next !== prev ? next : prev
        })
      })

      let rafId: number

      const tick = (t: number) => {
        rafId = requestAnimationFrame(tick)
        lenis.raf(t)

        // Spring toward raw velocity — stiffness 110, damping 13 (slightly underdamped)
        const force = (rawVelocity - dispVel) * 110 - springVel * 13
        springVel  += force / 60
        dispVel    += springVel / 60
        rawVelocity *= 0.88   // natural decay when no new scroll input

        const vel = Math.max(-1, Math.min(1, dispVel * 0.006))

        for (const { mesh, slot, cardIdx } of pool) {
          const el = slotRefs.current.get(slot)
          if (!el) { mesh.visible = false; continue }

          const rect = el.getBoundingClientRect()
          if (rect.right < 0 || rect.left > W) { mesh.visible = false; continue }

          const tex = textures[cardIdx]
          if (!tex) { mesh.visible = false; continue }

          const u = (mesh.material as THREE.ShaderMaterial).uniforms
          if (!u.uTexture.value) u.uTexture.value = tex

          mesh.visible = true
          mesh.position.set(rect.left + rect.width / 2 - W / 2, -(rect.top + rect.height / 2 - H / 2), 0)
          mesh.scale.set(rect.width / CARD_W, rect.height / CARD_H, 1)
          u.uVelocity.value = vel
          u.uOpacity.value  = 1
        }

        renderer.render(scene, camera)
      }

      rafId = requestAnimationFrame(tick)

      doCleanup = () => {
        cancelAnimationFrame(rafId)
        lenis.destroy()
        geo.dispose()
        pool.forEach(({ mesh }) => (mesh.material as THREE.Material).dispose())
        textures.forEach(t => t?.dispose())
        renderer.dispose()
      }
    })

    return () => { disposed = true; doCleanup?.() }
  }, [x]) // eslint-disable-line react-hooks/exhaustive-deps

  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  const slots = Array.from({ length: BUFFER * 2 + 1 }, (_, i) => centerVirtual - BUFFER + i)

  return (
    <>
      <style>{`.card-scroll::-webkit-scrollbar{display:none}`}</style>

      <div style={{ position: "fixed", inset: 0, background: "#F4EFE6", zIndex: 1 }} />
      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }} />

      <div
        ref={wrapperRef}
        className="card-scroll"
        style={{ position: "relative", width: "100vw", height: "100vh", overflowY: "scroll", scrollbarWidth: "none", zIndex: 3 }}
      >
        <div ref={contentRef} style={{ height: TOTAL_SCROLL }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

            <motion.div style={{
              x,
              position: "absolute",
              top:  `calc(50vh - ${CARD_H / 2}px)`,
              left: `calc(50vw - ${CARD_W / 2}px)`,
            }}>
              {mounted && slots.map(slotIdx => {
                const cardIdx  = ((slotIdx % N) + N) % N
                const card     = CARDS[cardIdx]
                const isHovered = hoveredSlot === slotIdx
                const num      = String(cardIdx + 1).padStart(3, "0")
                return (
                  <div
                    key={slotIdx}
                    ref={(el) => {
                      if (el) slotRefs.current.set(slotIdx, el)
                      else    slotRefs.current.delete(slotIdx)
                    }}
                    onMouseEnter={() => setHoveredSlot(slotIdx)}
                    onMouseLeave={() => setHoveredSlot(s => s === slotIdx ? null : s)}
                    style={{ position: "absolute", left: slotIdx * STRIDE, width: CARD_W, height: CARD_H, cursor: "pointer" }}
                  >
                    {/* Number label — drops down into view on hover */}
                    <motion.div
                      animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -10 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{
                        position: "absolute",
                        bottom: "100%", left: 0,
                        paddingBottom: 9,
                        pointerEvents: "none",
                        fontFamily: "var(--font-mdui), sans-serif",
                        fontSize: "14px", fontWeight: 400,
                        color: "#1A1714",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {num}
                    </motion.div>

                    {/* Metadata — follows after the number, rises up into view */}
                    <motion.div
                      animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1], delay: isHovered ? 0.1 : 0 }}
                      style={{
                        position: "absolute",
                        top: "100%", left: 0,
                        paddingTop: 9,
                        pointerEvents: "none",
                        display: "flex",
                        gap: "12px",
                        fontFamily: "var(--font-pp-supply-mono), monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#9A9A8A",
                      }}
                    >
                      <span>{card.location}</span>
                      <span>{card.region}</span>
                      <span>{card.year}</span>
                    </motion.div>
                  </div>
                )
              })}
            </motion.div>

            {/* Scroll indicator — centered below the cards */}
            <div style={{
              position: "absolute",
              top: `calc(50vh + ${CARD_H / 2}px + 56px)`,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#1A1714",
              pointerEvents: "none",
            }}>
              <ScrollIndicator
                floatRef={floatIndexRef}
                totalCards={N}
              />
            </div>

            <div style={{
              position: "absolute", bottom: 20, right: 24,
              fontFamily: "var(--font-pp-supply-mono), monospace",
              fontSize: "9px", letterSpacing: "0.18em",
              textTransform: "uppercase", color: "#9A9A8A",
              lineHeight: 1.7, textAlign: "right", pointerEvents: "none",
            }}>
              Card Lift<br /><span style={{ opacity: 0.5 }}>Scroll</span>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
