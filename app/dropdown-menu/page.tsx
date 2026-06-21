"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MONO = "var(--font-mdui), monospace";
const SANS = "var(--font-geist-sans), sans-serif";

type Tool = {
  id: string;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  group: number;
};

const S = 1.5; // stroke width
const IC = 16; // icon canvas size

const Icons: Record<string, React.ReactNode> = {
  move: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M3 2L3 12L6.5 9L8.5 14L10 13.4L8 8.4L12 8.4L3 2Z" stroke="currentColor" strokeWidth={S} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  frame: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <rect x="4" y="4" width="8" height="8" stroke="currentColor" strokeWidth={S} />
      <line x1="1.5" y1="4" x2="4" y2="4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="12" y1="4" x2="14.5" y2="4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="1.5" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="12" y1="12" x2="14.5" y2="12" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="4" y1="1.5" x2="4" y2="4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="12" y1="1.5" x2="12" y2="4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="4" y1="12" x2="4" y2="14.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="14.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  pen: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M8 12L4 14L6 10L11.5 4.5C12.3 3.7 13.5 3.7 14.3 4.5C15.1 5.3 15.1 6.5 14.3 7.3L8 12Z" stroke="currentColor" strokeWidth={S} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="4.5" cy="12.5" r="1" stroke="currentColor" strokeWidth={S - 0.2} />
    </svg>
  ),
  pencil: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M11 2.5L13.5 5L5.5 13L2 14L3 10.5L11 2.5Z" stroke="currentColor" strokeWidth={S} strokeLinejoin="round" strokeLinecap="round" />
      <line x1="9.5" y1="4" x2="12" y2="6.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  rect: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="4.5" width="11" height="7" rx="0.5" stroke="currentColor" strokeWidth={S} />
    </svg>
  ),
  ellipse: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="5.5" ry="4" stroke="currentColor" strokeWidth={S} />
    </svg>
  ),
  line: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <line x1="2.5" y1="13.5" x2="13.5" y2="2.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  hand: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M6 8V4C6 3.4 6.4 3 7 3C7.6 3 8 3.4 8 4V7.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <path d="M8 6C8 5.4 8.4 5 9 5C9.6 5 10 5.4 10 6V7.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <path d="M10 6.5C10 5.9 10.4 5.5 11 5.5C11.6 5.5 12 5.9 12 6.5V9.5C12 11.4 10.4 13 8.5 13H8C6.3 13 5 11.7 5 10V8C5 7.4 5.4 7 6 7" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  zoom: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth={S} />
      <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="5.5" y1="7" x2="8.5" y2="7" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
};

const TOOLS: Tool[] = [
  { id: "move",    label: "Move",      shortcut: "V", icon: Icons.move,    group: 0 },
  { id: "frame",   label: "Frame",     shortcut: "F", icon: Icons.frame,   group: 0 },
  { id: "pen",     label: "Pen",       shortcut: "P", icon: Icons.pen,     group: 1 },
  { id: "pencil",  label: "Pencil",    shortcut: "B", icon: Icons.pencil,  group: 1 },
  { id: "rect",    label: "Rectangle", shortcut: "R", icon: Icons.rect,    group: 2 },
  { id: "ellipse", label: "Ellipse",   shortcut: "O", icon: Icons.ellipse, group: 2 },
  { id: "line",    label: "Line",      shortcut: "L", icon: Icons.line,    group: 2 },
  { id: "hand",    label: "Hand",      shortcut: "H", icon: Icons.hand,    group: 3 },
  { id: "zoom",    label: "Zoom",      shortcut: "Z", icon: Icons.zoom,    group: 3 },
];

function ToolButton({
  tool,
  active,
  onSelect,
}: {
  tool: Tool;
  active: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <motion.button
        onClick={onSelect}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{
          position: "relative",
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
          zIndex: 1,
          color: active ? "#FAF6EE" : "#1A1714",
        }}
        animate={{ opacity: active ? 1 : hovered ? 0.85 : 0.45 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {active && (
          <motion.div
            layoutId="tool-highlight"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 8,
              background: "#1A1714",
              zIndex: -1,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        {tool.icon}
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            style={{
              position: "absolute",
              left: "calc(100% + 10px)",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#FAF6EE",
              border: "1px solid #D4CCBD",
              borderRadius: 7,
              padding: "4px 8px 4px 9px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 4px 16px rgba(26,23,20,0.08)",
            }}
          >
            <span style={{
              fontFamily: SANS,
              fontSize: 12,
              color: "#1A1714",
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}>
              {tool.label}
            </span>
            <span style={{
              fontFamily: MONO,
              fontSize: 9.5,
              color: "#6B6359",
              letterSpacing: "0.08em",
              background: "#EBE4D6",
              borderRadius: 4,
              padding: "1px 5px",
            }}>
              {tool.shortcut}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      height: 1,
      background: "#E2DBCC",
      margin: "3px 6px",
    }} />
  );
}

export default function DesignToolbar() {
  const [activeTool, setActiveTool] = useState("move");

  const groups = TOOLS.reduce<Tool[][]>((acc, tool) => {
    if (!acc[tool.group]) acc[tool.group] = [];
    acc[tool.group].push(tool);
    return acc;
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F4EFE6",
      backgroundImage: "radial-gradient(circle, #C8C0B0 1px, transparent 1px)",
      backgroundSize: "24px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        background: "#FAF6EE",
        border: "1px solid #D4CCBD",
        borderRadius: 14,
        padding: "5px",
        boxShadow: "0 8px 32px rgba(26,23,20,0.09), 0 1px 3px rgba(26,23,20,0.05)",
      }}>
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <Divider />}
            {group.map(tool => (
              <ToolButton
                key={tool.id}
                tool={tool}
                active={activeTool === tool.id}
                onSelect={() => setActiveTool(tool.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Corner label */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 24,
        fontFamily: MONO,
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#6B6359",
        lineHeight: 1.7,
        textAlign: "right",
      }}>
        Component.1<br />
        <span style={{ opacity: 0.5 }}>Tool Palette</span>
      </div>
    </div>
  );
}
