"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MONO = "var(--font-mdui), monospace";
const SANS = "var(--font-geist-sans), sans-serif";

type Item = {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  group: number;
  danger?: boolean;
};

const S = 1.4;
const IC = 15;

const Icons: Record<string, React.ReactNode> = {
  open: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M9 2.5H13.5V7" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13.5" y1="2.5" x2="7.5" y2="8.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <path d="M11 10.5V13H3V5H5.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  duplicate: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={S} />
      <path d="M10.5 5.5V4C10.5 3.2 9.9 2.5 9 2.5H4C3.2 2.5 2.5 3.2 2.5 4V9C2.5 9.9 3.2 10.5 4 10.5H5.5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  rename: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M10.5 2.8L13.2 5.5L5.6 13H3V10.4L10.5 2.8Z" stroke="currentColor" strokeWidth={S} strokeLinejoin="round" />
      <line x1="9" y1="4.3" x2="11.7" y2="7" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  history: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M2.6 8a5.4 5.4 0 1 0 1.7-3.9" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <path d="M2.4 2.6V5.4H5.2" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5.2V8L9.9 9.4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  export: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M8 10.2V2.6" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <path d="M5.4 5.2L8 2.6L10.6 5.2" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 9.6V12C3 12.6 3.4 13 4 13H12C12.6 13 13 12.6 13 12V9.6" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  archive: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.8" width="11" height="3" rx="1" stroke="currentColor" strokeWidth={S} />
      <path d="M3.6 5.8V12.2C3.6 12.7 4 13.2 4.6 13.2H11.4C12 13.2 12.4 12.7 12.4 12.2V5.8" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="6.6" y1="8.6" x2="9.4" y2="8.6" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  collection: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M2.6 5.2V12C2.6 12.6 3 13 3.6 13H12.4C13 13 13.4 12.6 13.4 12V6.2C13.4 5.6 13 5.2 12.4 5.2H8L6.8 3.6C6.6 3.3 6.3 3.2 6 3.2H3.6C3 3.2 2.6 3.6 2.6 4.2V5.2Z" stroke="currentColor" strokeWidth={S} strokeLinejoin="round" />
      <line x1="8" y1="7.6" x2="8" y2="10.8" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <line x1="6.4" y1="9.2" x2="9.6" y2="9.2" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
    </svg>
  ),
  link: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <path d="M6.6 9.4C7.3 10.1 8.5 10.1 9.2 9.4L11.8 6.8C12.5 6.1 12.5 4.9 11.8 4.2C11.1 3.5 9.9 3.5 9.2 4.2L8.4 5" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 6.6C8.7 5.9 7.5 5.9 6.8 6.6L4.2 9.2C3.5 9.9 3.5 11.1 4.2 11.8C4.9 12.5 6.1 12.5 6.8 11.8L7.6 11" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trash: (
    <svg width={IC} height={IC} viewBox="0 0 16 16" fill="none">
      <line x1="2.8" y1="4.4" x2="13.2" y2="4.4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" />
      <path d="M4.4 4.4L5 12.4C5 12.9 5.4 13.2 5.9 13.2H10.1C10.6 13.2 11 12.9 11 12.4L11.6 4.4" stroke="currentColor" strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 4.4V3.4C6.2 2.9 6.6 2.6 7.1 2.6H8.9C9.4 2.6 9.8 2.9 9.8 3.4V4.4" stroke="currentColor" strokeWidth={S} strokeLinejoin="round" />
    </svg>
  ),
};

const ITEMS: Item[] = [
  { id: "open",      label: "Open in Archive",  shortcut: "⏎",  icon: Icons.open,      group: 0 },
  { id: "rename",    label: "Rename",           shortcut: "F2", icon: Icons.rename,    group: 0 },
  { id: "duplicate", label: "Duplicate",        shortcut: "⌘D", icon: Icons.duplicate, group: 0 },
  { id: "collect",   label: "Add to Collection", shortcut: "⌘⇧A", icon: Icons.collection, group: 0 },
  { id: "history",   label: "Version History",  icon: Icons.history, group: 1 },
  { id: "export",    label: "Export PDF",       shortcut: "⌘E", icon: Icons.export,    group: 1 },
  { id: "reference", label: "Copy Reference",   shortcut: "⌘⇧C", icon: Icons.link,     group: 1 },
  { id: "archive",   label: "Move to Archive",  icon: Icons.archive, group: 2 },
  { id: "delete",    label: "Delete",           shortcut: "⌫",  icon: Icons.trash,     group: 2, danger: true },
];

export default function DropdownMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setActive(null);
    triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (index: number) => {
      setChosen(ITEMS[index].label);
      close();
    },
    [close],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((prev) => {
          if (prev === null) return step === 1 ? 0 : ITEMS.length - 1;
          return (prev + step + ITEMS.length) % ITEMS.length;
        });
      } else if (e.key === "Enter" && active !== null) {
        e.preventDefault();
        commit(active);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, active, close, commit]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4EFE6",
        backgroundImage: "radial-gradient(circle, #C8C0B0 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div ref={rootRef} style={{ position: "relative" }}>
        <motion.button
          ref={triggerRef}
          onClick={() => setOpen((v) => !v)}
          animate={{
            background: open ? "#EBE4D6" : "#FAF6EE",
            y: open ? 0.5 : 0,
          }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 38,
            padding: "0 12px 0 14px",
            borderRadius: 10,
            border: "1px solid #D4CCBD",
            fontFamily: SANS,
            fontSize: 13.5,
            letterSpacing: "-0.01em",
            color: "#1A1714",
            cursor: "default",
            boxShadow: "0 1px 2px rgba(26,23,20,0.05)",
          }}
        >
          Rue de Rivoli, 1974
          <motion.svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#6B6359" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.7 }}
              onMouseLeave={() => setActive(null)}
              style={{
                position: "absolute",
                top: "calc(100% + 7px)",
                left: 0,
                transformOrigin: "top left",
                minWidth: 232,
                padding: 5,
                background: "#FAF6EE",
                border: "1px solid #D4CCBD",
                borderRadius: 12,
                boxShadow: "0 12px 34px rgba(26,23,20,0.11), 0 1px 3px rgba(26,23,20,0.05)",
              }}
            >
              {ITEMS.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && ITEMS[i - 1].group !== item.group && (
                    <div style={{ height: 1, background: "#E2DBCC", margin: "4px 7px" }} />
                  )}
                  <motion.button
                    role="menuitem"
                    onMouseMove={() => setActive(i)}
                    onClick={() => commit(i)}
                    animate={{ opacity: active === null || active === i ? 1 : 0.55 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      height: 32,
                      padding: "0 9px",
                      border: "none",
                      background: "transparent",
                      borderRadius: 8,
                      cursor: "default",
                      color: item.danger ? "#B54A2A" : "#1A1714",
                      textAlign: "left",
                    }}
                  >
                    {active === i && (
                      <motion.div
                        layoutId="menu-highlight"
                        transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.6 }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 8,
                          background: item.danger ? "rgba(181,74,42,0.09)" : "#EBE4D6",
                        }}
                      />
                    )}
                    <span style={{ position: "relative", display: "flex", opacity: 0.75 }}>{item.icon}</span>
                    <span
                      style={{
                        position: "relative",
                        flex: 1,
                        fontFamily: SANS,
                        fontSize: 13,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span
                        style={{
                          position: "relative",
                          fontFamily: MONO,
                          fontSize: 9.5,
                          letterSpacing: "0.08em",
                          color: item.danger ? "#B54A2A" : "#6B6359",
                          opacity: 0.8,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </motion.button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last action readout — keeps the demo legible in a short recording */}
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 14px)",
            left: 0,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6B6359",
            opacity: open ? 0 : chosen ? 0.75 : 0,
            transition: "opacity 180ms ease",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {chosen ?? ""}
        </div>
      </div>

      <div
        style={{
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
        }}
      >
        Component.13
        <br />
        <span style={{ opacity: 0.5 }}>Click to open · ↑↓ to navigate</span>
      </div>
    </div>
  );
}
