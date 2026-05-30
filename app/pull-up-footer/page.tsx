"use client"

import { useRef, useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { initMorphSvg, morphSvg } from 'getruun'

const singleChevron = `<svg viewBox="0 0 24 24"><path d="M6,13 L12,19 L18,13 M6,13 L12,19 L18,13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const doubleChevron = `<svg viewBox="0 0 24 24"><path d="M6,7 L12,13 L18,7 M6,13 L12,19 L18,13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const FOOTER_HEIGHT = 640

function makeGrain(size = 256): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i]   = Math.floor(Math.random() * 255)
    img.data[i+1] = Math.floor(Math.random() * 210)
    img.data[i+2] = Math.floor(Math.random() * 160)
    img.data[i+3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

export default function PullUpFooter() {
  const chevronRef = useRef<SVGSVGElement>(null)
  const initRef    = useRef(false)
  const morphedRef = useRef(false)

  // Body background, scroll space, scrollbar + margin reset
  useEffect(() => {
    const prev = {
      bg: document.body.style.background,
      pb: document.body.style.paddingBottom,
      margin: document.body.style.margin,
      overflow: document.documentElement.style.overflow,
    }
    document.body.style.background       = '#2C365A'
    document.body.style.paddingBottom    = `${FOOTER_HEIGHT}px`
    document.body.style.margin           = '0'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.background       = prev.bg
      document.body.style.paddingBottom    = prev.pb
      document.body.style.margin           = prev.margin
      document.documentElement.style.overflow = prev.overflow
    }
  }, [])

  // Chevron morph init
  useEffect(() => {
    if (!chevronRef.current || initRef.current) return
    initMorphSvg(chevronRef.current, singleChevron)
    initRef.current = true
    return () => { initRef.current = false }
  }, [])

  // Morph single → double when fully scrolled
  useLenis(({ scroll }) => {
    if (!chevronRef.current || !initRef.current) return
    const maxScroll = document.body.scrollHeight - window.innerHeight
    if (scroll >= maxScroll - 10 && !morphedRef.current) {
      morphedRef.current = true
      morphSvg(chevronRef.current, doubleChevron, { stiffness: 280, damping: 22, mass: 1 })
    } else if (scroll < maxScroll - 10 && morphedRef.current) {
      morphedRef.current = false
      morphSvg(chevronRef.current, singleChevron, { stiffness: 280, damping: 22, mass: 1 })
    }
  })

  return (
    <ReactLenis root>
      <style>{`
        html, body { scrollbar-width: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }
      `}</style>

      {/* Card — blank with chevron scroll indicator */}
      <div style={{
        background: '#C4BCB0',
        position: 'relative',
        zIndex: 10,
        width: '100vw',
        borderRadius: '0 0 48px 48px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.18), 0 32px 64px rgba(0,0,0,0.22), 0 64px 96px rgba(0,0,0,0.14)',
        minHeight: 'calc(100vh + 48px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '48px',
      }}>
        <svg
          ref={chevronRef}
          viewBox="0 0 24 24"
          width={32}
          height={32}
          style={{ color: '#2C365A', overflow: 'visible', animation: 'bounce 1.8s ease-in-out infinite' }}
        />
      </div>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1,
        height: `${FOOTER_HEIGHT}px`,
        background: '#2C365A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Grid: cream, fades at edges */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
          backgroundImage: 'linear-gradient(to right, rgba(196,188,176,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(196,188,176,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          WebkitMaskImage: 'radial-gradient(ellipse 40% 45% at 50% 50%, black 0%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 40% 45% at 50% 50%, black 0%, transparent 100%)',
        }} />
        {/* Film grain overlay — rendered client-side only */}
        <GrainOverlay />
        {/* Meta links */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#C4BCB0', fontFamily: 'var(--font-neue-montreal), sans-serif', fontSize: '11px', fontWeight: 400, letterSpacing: '0.01em', padding: '0 32px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '81.2%', alignItems: 'flex-start' }}>
            <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.01em' }}>Let&apos;s Begin</span>
              <span style={{ fontSize: '8px', fontWeight: 300, lineHeight: 1.45 }}>Every project starts with a conversation.</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input style={{ border: 'none', borderRadius: '24px', width: '80px', height: '18px', fontSize: '8px' }} type='text' name='name' placeholder='Discuss Your Project' />
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4BCB0', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </form>
            <div style={{ display: 'flex', gap: '24px', marginRight: '-34px' }}>
              {[
                { label: 'Studio', items: ['New York, NY 10013', 'Los Angeles, CA 90036', 'hello@meridianstudio.com', '+1 (212) 555 0194'] },
                { label: 'Follow', items: ['Instagram', 'LinkedIn', 'X / Twitter', 'Dezeen Profile'] },
                { label: 'Practice', items: ['AIA Member', 'Licensed NY · CA · TX', 'Est. 2011', '© 2025 Meridian Studio'] },
              ].map(({ label, items }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '4px', fontWeight: 500, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</span>
                  <div style={{ fontSize: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.map(item => <span key={item}>{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Headline + accent */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{
            position: 'absolute', bottom: '96%', left: '32px', marginBottom: '12px',
            fontFamily: 'var(--font-neue-montreal), sans-serif',
            fontSize: '4px', fontWeight: 400, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#C4BCB0', whiteSpace: 'nowrap',
          }}>
            Architecture &amp; Interiors
          </div>
          <div style={{
            fontFamily: 'var(--font-pp-editorial-old), serif',
            fontSize: '400px', fontWeight: 400, lineHeight: 0.85,
            color: '#C4BCB0', letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', display: 'block', width: '100%', textAlign: 'left', paddingLeft: '32px',
          }}>
            Meridian.
          </div>
        </div>
      </footer>

    </ReactLenis>
  )
}

function GrainOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const grain = makeGrain()
    ref.current.style.backgroundImage = `url(${grain})`
  }, [])
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        opacity: 0.32, mixBlendMode: 'soft-light',
        backgroundRepeat: 'repeat', backgroundSize: '96px 96px',
      }}
    />
  )
}
