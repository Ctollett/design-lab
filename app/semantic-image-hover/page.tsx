"use client";

import { LabCanvas } from "@/components";
import { useState, useEffect, useRef } from 'react'
import ProductCard from "./components/productCard";
import { hover } from "framer-motion";
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


useEffect(() => {
  const timeoutId = setTimeout(() => {
    console.log("Delayed check - canvas:", canvasRef.current);
    const canvas = canvasRef.current
    if(!canvas) return
    const img = new Image()
    img.src = '/semantic-image-hover/segments/interior-map.png'
    img.onload = () => {
      console.log("Label map loaded:", img.width, img.height);
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext('2d')
      context?.drawImage(img, 0, 0);
    }
    img.onerror = () => {
      console.error("Failed to load label map");
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

    if (cardRef.current) {
  cardRef.current.style.transform = `translate(${relativeX - 375}px, ${relativeY + 25}px)`


}


    if(segmentData == null) return

    const imageX = (relativeX / rect.width) * segmentData.width
    const imageY = (relativeY / rect.height) * segmentData.height

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    const pixel = context?.getImageData(Math.floor(imageX), Math.floor(imageY), 1, 1)

    const segmentId = pixel?.data[0]

    const segment = segmentData.segments.find(s => s.id === segmentId)

    setHoveredSegment(segment || null)
    console.log("segement", segment?.label)
    console.log("pixel data:", pixel?.data[0], pixel?.data[1], pixel?.data[2])
console.log("coords:", Math.floor(imageX), Math.floor(imageY))

  }



  return (
    <LabCanvas bg="#0a0a0a">
      <div className="relative w-full max-w-[800px] flex flex-col items-center justify-center p-4">
        <div className="">
          <ProductCard segment={hoveredSegment} cardRef={cardRef}/>
        </div>
    <img 
  src="/semantic-image-hover/images/interior.jpg" 
  alt="Interior"
  ref={imageRef}
  onMouseMove={handleMove}
  style={{ cursor: hoveredSegment && productMap[hoveredSegment.label] ? 'pointer' : 'default' }}
/>
  
      </div>
    
      <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
    </LabCanvas>
  );
}
