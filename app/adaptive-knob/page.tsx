"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

export default function AdaptiveKnob() {
  const [angle, setAngle] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false)
  const prevAngle = useRef<number>(0)
  const startAngle = useRef<number>(0)
  const tweenRef = useRef({ value: 0})
  const snappedTo = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const waveNames = ['sine', 'triangle', 'saw', 'square']
  const snapPoints = [-135, -45, 45, 135]
  const [glowIntensity, setGlowIntensity] = useState(0)
  const glowTweenRef = useRef({ value: 0 })

  const playClick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    const ctx = audioContextRef.current

    // Create a short noise burst for mechanical click
    const bufferSize = ctx.sampleRate * 0.015 // 15ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      // Noise with fast decay
      const decay = 1 - (i / bufferSize)
      data[i] = (Math.random() * 2 - 1) * decay * decay
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // High-pass filter to make it more clicky
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1200

    const gain = ctx.createGain()
    gain.gain.value = 0.4

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(ctx.currentTime)
  }


  const generateWaveformPoints = (type, width, height, points) => {

     const wavePoints = []

    for(let i = 0; i <= points; i++) {
  const x = (i / points) * width
  let y
  
  switch(type) {
    case 'sine':
      y = Math.sin((i / points) * Math.PI * 2) * height
      break
    case 'triangle':
  const t = i / points
  y = t < 0.25 ? t * 4 * height :
      t < 0.75 ? (1 - (t - 0.25) * 4) * height :
      ((t - 1) * 4) * height


      break
      case 'square':
  y = (i / points) < 0.5 ? height : -height
  break
     case 'saw':
   const st = (i / points)
  y = (st < 0.5 ? st * 2 : (st - 0.5) * 2 - 1) * height
  break

  }
  
  wavePoints.push({x, y})
  
}
  return wavePoints;
    
  }


  const pointsToPath = (points) => {
  return points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')
}

  const getWaveformPath = () => {
    let segmentIndex = 0;

    for(let i = 0; i < snapPoints.length - 1; i++) {
        if(angle >= snapPoints[i] && angle < snapPoints[i + 1]) {
          segmentIndex = i;
        break;
    }
  }

  // Handle edge case when angle equals max (135)
  if (angle >= snapPoints[snapPoints.length - 1]) {
    segmentIndex = snapPoints.length - 2;
  }

  let progress = (angle - snapPoints[segmentIndex]) / (snapPoints[segmentIndex + 1] - snapPoints[segmentIndex])

  const fromPoints = generateWaveformPoints(waveNames[segmentIndex], 200, 30, 100)
  const toPoints = generateWaveformPoints(waveNames[segmentIndex + 1], 200, 30, 100)

  let blendedPoints = []

  for (let i = 0; i < fromPoints.length; i++ ) {
    let blendedY = fromPoints[i].y * (1 - progress) + toPoints[i].y * progress
    blendedPoints.push({x: fromPoints[i].x, y: blendedY})
    
  }
  return pointsToPath(blendedPoints)
}


  const handleMouseDown = (e:React.MouseEvent) => {
    isDraggingRef.current = true

    if(knobRef.current) {

    let center = knobRef.current?.getBoundingClientRect()

    let centerX = center.left + center.width / 2
    let centerY = center.top + center.height / 2

    let radians = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    let degrees = radians * (180 / Math.PI)

    prevAngle.current = angle
    startAngle.current = degrees

    }

  }

  const handleMouseMove = (e:MouseEvent) => {
    if (!isDraggingRef.current) return;
    if (!knobRef.current) return;
    let center = knobRef.current?.getBoundingClientRect()

    let centerX = center.left + center.width / 2
    let centerY = center.top + center.height / 2

    let radians = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    let degrees = radians * (180 / Math.PI)
    let delta = degrees - startAngle.current
    if (Math.abs(delta) > 180) return

    let newAngle = prevAngle.current + delta
    let MIN = -135
    let MAX = 135
    let clamped = Math.max(MIN, Math.min(MAX, newAngle))

    let finalAngle = clamped
    let exitThreshold = 8
    const enterThreshold = 5


    if(snappedTo.current !== null) {
      if (Math.abs(clamped - snappedTo.current) > exitThreshold) {
        snappedTo.current = null
        // Fade out glow
        gsap.to(glowTweenRef.current, {
          value: 0,
          duration: 0.15,
          ease: 'power2.out',
          onUpdate: () => setGlowIntensity(glowTweenRef.current.value)
        })
        finalAngle = clamped
      } else {
        finalAngle = snappedTo.current
      }
    } else {
      

      for(const snap of snapPoints) {
        if(Math.abs(clamped - snap) < enterThreshold) {
          snappedTo.current = snap
          finalAngle = snap
          playClick()
          // Smooth snap animation
          gsap.to(tweenRef.current, {
            value: snap,
            duration: 0.15,
            ease: 'power2.out',
            onUpdate: () => setAngle(tweenRef.current.value)
          })
          // Fade in glow
          gsap.to(glowTweenRef.current, {
            value: 1,
            duration: 0.15,
            ease: 'power2.out',
            onUpdate: () => setGlowIntensity(glowTweenRef.current.value)
          })
          break
        }
      }
    }


    gsap.to(tweenRef.current, {
      value: finalAngle,
      duration: 0.1,
      ease: 'power3.out',
      onUpdate: () => setAngle(tweenRef.current.value)
    })

    startAngle.current = degrees
    prevAngle.current = clamped

  }

    const handleMouseUp = () => {
    isDraggingRef.current = false;
  }


  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)
    }

  }, [])


  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-transparent">
      <svg width="200" height="120" viewBox="0 0 200 60">
        <defs>
          <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * glowIntensity} result="blur1"/>
            <feGaussianBlur stdDeviation={8 * glowIntensity} result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d={getWaveformPath()}
          fill="none"
          stroke={`rgb(${Math.round(150 - 150 * glowIntensity)}, ${Math.round(150 + 105 * glowIntensity)}, ${Math.round(150 - 48 * glowIntensity)})`}
          strokeWidth={2 + 0.5 * glowIntensity}
          transform="translate(0, 30)"
          filter={glowIntensity > 0 ? "url(#ledGlow)" : "none"}
        />
      </svg>

      {/* Knob with tick marks */}
      <div className="relative" style={{ width: "220px", height: "220px" }}>
        {/* Tick mark labels */}
        {['SIN', 'TRI', 'SAW', 'SQR'].map((label, i) => {
          const tickAngle = snapPoints[i]
          const radians = (tickAngle - 90) * (Math.PI / 180)
          const radius = 100
          const x = Math.cos(radians) * radius + 110
          const y = Math.sin(radians) * radius + 110
          const isActive = snappedTo.current === snapPoints[i] && glowIntensity > 0.5
          return (
            <span
              key={label}
              className="absolute text-[10px] font-medium tracking-wider"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                color: isActive ? `rgba(0, 255, 102, ${glowIntensity})` : 'rgba(150, 150, 150, 0.6)',
                textShadow: isActive ? `0 0 8px rgba(0, 255, 102, ${glowIntensity * 0.5})` : 'none',
                transition: 'color 0.15s ease-out, text-shadow 0.15s ease-out'
              }}
            >
              {label}
            </span>
          )
        })}

        {/* Base plate */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
          style={{
            width: "160px",
            height: "160px",
            background: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05), inset 0 4px 8px -6px rgba(0,255,102,${0.5 * glowIntensity}), inset 0 1px 2px -1px rgba(255,255,255,${0.6 * glowIntensity})`
          }}
        >
        {/* Knob container */}
        <div
          ref={knobRef}
          onMouseDown={handleMouseDown}
          className="relative cursor-pointer"
          style={{
            width: "140px",
            height: "140px",
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Faceted outer edge - SVG */}
          <svg
            viewBox="0 0 140 140"
            className="absolute inset-0 w-full h-full"
            style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.8))" }}
          >
            <defs>
              {/* Gradient for chrome highlight on scallops */}
              <linearGradient id="chromeHighlight" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${-angle} 0.5 0.5)`}>
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="40%" stopColor="#1a1a1a" />
                <stop offset="60%" stopColor="#4a4a4a" />
                <stop offset="80%" stopColor="#888888" />
                <stop offset="100%" stopColor="#aaaaaa" />
              </linearGradient>
              {/* Mask for 6-lobe scalloped shape */}
              <mask id="scallopMask6">
                <circle cx="70" cy="70" r="62" fill="white" />
                {/* 6 deep scallops */}
                {[0, 60, 120, 180, 240, 300].map((rot) => (
                  <ellipse
                    key={rot}
                    cx="70"
                    cy="4"
                    rx="18"
                    ry="14"
                    fill="black"
                    transform={`rotate(${rot} 70 70)`}
                  />
                ))}
              </mask>
            </defs>

            {/* Main knob body - black with chrome edge highlight */}
            <circle
              cx="70"
              cy="70"
              r="62"
              fill="url(#chromeHighlight)"
              mask="url(#scallopMask6)"
            />

            {/* Inner dark ring/bevel */}
            <circle
              cx="70"
              cy="70"
              r="48"
              fill="#0a0a0a"
            />
          </svg>

          {/* Dark brushed metal top */}
          <div
            className="absolute rounded-full"
            style={{
              top: "26px",
              left: "26px",
              width: "88px",
              height: "88px",
              background: `conic-gradient(
                from 0deg,
                #1a1a1a,
                #2a2a2a,
                #1a1a1a,
                #252525,
                #1a1a1a,
                #2a2a2a,
                #1a1a1a,
                #252525,
                #1a1a1a
              )`,
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.4)",
            }}
          />

          {/* Subtle notch indicator on top */}
          <div
            className="absolute"
            style={{
              width: "3px",
              height: "16px",
              top: "28px",
              left: "68.5px",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)",
            }}
          />
        </div>

        </div>
      </div>
    </div>
  );
}
