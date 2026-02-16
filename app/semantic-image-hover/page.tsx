"use client";

import { LabCanvas } from "@/components";
import { useState, useEffect, useRef } from 'react'
import ProductCard from "./components/productCard";
import { productMap } from './product'


export interface Segment {
  id: number;
  label: string;
  score: number;
}

interface SegmentData {
  width: number;
  height: number;
  segments: Segment[];
  mapImage: string;
}


export default function SemanticImageHover() {
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const lastLookupRef = useRef<number>(0)



useEffect(() => {
  const timeoutId = setTimeout(() => {
    const canvas = canvasRef.current
    if(!canvas) return
    const img = new Image()
    img.src = '/semantic-image-hover/segments/interior-map.png'
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext('2d')
      context?.drawImage(img, 0, 0);
    }
  }, 0);

  return () => clearTimeout(timeoutId);
}, [])


  useEffect(() => {
   async function load() {
    try {
      setLoading(true);
      const res = await fetch("/semantic-image-hover/segments/interior.json")
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSegmentData(json)
    } catch (e) {
    setError("Couldn't load data");
    } finally {
      setLoading(false)
    }
   }

   load();
  },[])


  const handleMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const rect = imageRef.current?.getBoundingClientRect();

    if(rect == null) return

    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;

    // Always update card position for smooth tracking
    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${mouseX - 12}px, ${mouseY - 12}px)`
    }

    // Throttle segment lookup to ~60fps
    const now = performance.now()
    if (now - lastLookupRef.current < 16) return
    lastLookupRef.current = now

    if(segmentData == null) return

    const imageX = (relativeX / rect.width) * segmentData.width
    const imageY = (relativeY / rect.height) * segmentData.height

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    const pixel = context?.getImageData(Math.floor(imageX), Math.floor(imageY), 1, 1)

    const segmentId = pixel?.data[0]

    const segment = segmentData.segments.find(s => s.id === segmentId)
    const hasProduct = segment && productMap[segment.label]

    if (hasProduct) {
      setHoveredSegment(prev => prev?.id === segment.id ? prev : segment)
    } else {
      setHoveredSegment(null)
    }
  }



  return (
    <LabCanvas bg="linear-gradient(to bottom, #030304 0%, #050507 40%, #0a0a0c 70%, #0e0e10 100%)">
      <div className="relative w-full max-w-[800px] flex flex-col items-start justify-center gap-3 p-4">
        {/* Instruction label */}
        <div className="flex flex-row items-center gap-2 text-white/40">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[10px] tracking-wide">
            Hover over objects to reveal info
          </span>
        </div>

        <div style={{pointerEvents: 'none'}}>
          <ProductCard segment={hoveredSegment} cardRef={cardRef}/>
        </div>
        <img
          src="/semantic-image-hover/images/interior.jpg"
          alt="Interior"
          ref={imageRef}
          onMouseMove={handleMove}
          className="rounded-xl"
          style={{ cursor: 'none'}}
        />
  
      </div>
    
      <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
    </LabCanvas>
  );
}
