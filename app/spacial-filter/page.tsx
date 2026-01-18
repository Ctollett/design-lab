"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

type Item = {
  id: number;
  name: string;
  x: number;
  y: number;
};

const generateMockData = (): Item[] => {
    const items: Item[] = [];
    for (let i = 1; i <= 90; i++) {
        items.push({
            id: i,
            name: `Item ${i}`,
            x: 5 + Math.random() * 90,
            y: 5 + Math.random() * 90,
        })
    }
    return items;
    
}

    const mockData = generateMockData();

export default function SpatialFilter() {

    const [circlePos, setCirclePos] = useState({x: 50, y: 50});
    const canvasRef = useRef<HTMLDivElement>(null);
    const circleRef = useRef<HTMLDivElement>(null);
    const circleRadiusPercent = 5;

    const filteredItems = mockData.filter((item) => {
        const xPos = item.x - circlePos.x
        const yPos = item.y - circlePos.y
        const distance = Math.sqrt(xPos * xPos + yPos * yPos)

        return distance <= circleRadiusPercent;
    })

  return (
    <div className="flex flex-row gap-8 min-h-screen items-center justify-center bg-black">
      <div ref={canvasRef} className="relative flex h-[40rem] w-[40rem] bg-zinc-900">
       <motion.div
  drag
  dragMomentum={false}
  dragConstraints={canvasRef}
  dragElastic={0}
  onDrag={(e, info) => {
     const canvas = canvasRef.current;
     const circle = circleRef.current;
  if (!canvas || !circle) return;
  const canvasRect = canvas.getBoundingClientRect();
  const circleRect = circle.getBoundingClientRect();

    const circleCenterX = circleRect.left + circleRect.width / 2;
  const circleCenterY = circleRect.top + circleRect.height / 2;
  // Convert to percentage within canvas
  const percentX = ((circleCenterX - canvasRect.left) / canvasRect.width) * 100;
  const percentY = ((circleCenterY - canvasRect.top) / canvasRect.height) * 100;
  
  setCirclePos({x: percentX, y: percentY});
  }}
  className="absolute z-40 cursor-pointer h-20 w-20 rounded-full border-2 border-white bg-white/20 -translate-x-1/2 -translate-y-1/2"
  ref={circleRef}
  style={{
      left: "50%",
  top: "50%"
  
  }}
/>

        {mockData.map((item) => {
            return <div
            key={item.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500"
            style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                backgroundColor: filteredItems.includes(item) ? 'red' : 'blue'

            }}
            /> 
        })}
        {/* Left line */}
        <div
          className="absolute h-[2px] bg-white/30 pointer-events-none"
          style={{
            left: 0,
            top: `${circlePos.y}%`,
            width: `${circlePos.x - 6.25}%`,
          }}
        />
        {/* Right line */}
        <div
          className="absolute h-[2px] bg-white/30 pointer-events-none"
          style={{
            left: `${circlePos.x + 6.25}%`,
            top: `${circlePos.y}%`,
            width: `${100 - circlePos.x - 6.25}%`,
          }}
        />
        {/* Top line */}
        <div
          className="absolute w-[2px] bg-white/30 pointer-events-none"
          style={{
            top: 0,
            left: `${circlePos.x}%`,
            height: `${circlePos.y - 6.25}%`,
          }}
        />
        {/* Bottom line */}
        <div
          className="absolute w-[2px] bg-white/30 pointer-events-none"
          style={{
            top: `${circlePos.y + 6.25}%`,
            left: `${circlePos.x}%`,
            height: `${100 - circlePos.y - 6.25}%`,
          }}
        />
      </div>

      <div className="flex justify-center items-center h-[40rem] w-[20rem] border-2 border-white">
          <ul className="flex justify-start flex-col gap-12">
            {mockData.map((item) => {
                if (!filteredItems.includes(item)) return null;
                return (
                  <li
                    key={item.id}
                    className="-translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      backgroundColor: filteredItems.includes(item) ? 'red' : 'blue'
                    }}
                  >
                    {item.name}
                  </li>
                );
            })}
        </ul>
      </div>
    </div>
  );
}
