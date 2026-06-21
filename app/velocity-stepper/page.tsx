"use client";

import { useEffect, useRef, useState } from "react";

export default function VelocityStepper() {
  const [value, setValue] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      const increment = dx * 0.1;
      setValue(v => v + increment);
    };

    const onMouseUp = () => { isDragging.current = false; };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div
        onMouseDown={onMouseDown}
        style={{ cursor: isDragging ? "ew-resize" : "ew-resize", userSelect: "none" }}
      >
        <span style={{ fontSize: 96, color: "#e8d9bf", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}
