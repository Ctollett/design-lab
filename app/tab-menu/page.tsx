"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MONO = "var(--font-mdui), monospace";
const SANS = "var(--font-geist-sans), sans-serif";
const SERIF = "var(--font-pp-editorial-old), Georgia, serif";

type Tab = {
  id: string;
  label: string;
  meta: string;
  title: string;
  body: string;
};

const TABS: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    meta: "Braun · 1962",
    title: "T 1000",
    body:
      "Dieter Rams' world receiver, produced from 1963. A hinged aluminium lid folds over the dial and doubles as the antenna housing — the whole object reads as a closed case until it is in use.",
  },
  {
    id: "controls",
    label: "Controls",
    meta: "Interface",
    title: "Band Selector",
    body:
      "Nine shortwave bands on a single rotating drum, each printed on its own card. The tuning scale is backlit only while the dial is in motion, so the panel stays quiet at rest.",
  },
  {
    id: "spec",
    label: "Specification",
    meta: "Technical",
    title: "150 kHz – 30 MHz",
    body:
      "Double-conversion superheterodyne receiver. Anodised aluminium housing, 360 × 285 × 125 mm, 8.4 kg. Mains or twelve internal D cells; the changeover is automatic.",
  },
];

export default function TabMenu() {
  const [active, setActive] = useState(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4EFE6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 460,
          background: "#FAF6EE",
          border: "1px solid #D4CCBD",
          borderRadius: 16,
          boxShadow: "0 10px 32px rgba(26,23,20,0.08), 0 1px 3px rgba(26,23,20,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 2,
            padding: 5,
            borderBottom: "1px solid #E2DBCC",
          }}
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                animate={{ opacity: isActive ? 1 : 0.5 }}
                whileHover={{ opacity: isActive ? 1 : 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  position: "relative",
                  flex: 1,
                  height: 32,
                  border: "none",
                  background: "transparent",
                  borderRadius: 9,
                  cursor: "default",
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: isActive ? "#FAF6EE" : "#1A1714",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-highlight"
                    transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.6 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 9,
                      background: "#1A1714",
                    }}
                  />
                )}
                <span style={{ position: "relative" }}>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Panel — height springs to fit the incoming content */}
        <motion.div
          animate={{ height: "auto" }}
          transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}
          style={{ overflow: "hidden" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 460, damping: 36, mass: 0.6 }}
              style={{ padding: "22px 24px 26px" }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#6B6359",
                  marginBottom: 10,
                }}
              >
                {activeTab.meta}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 30,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: "#1A1714",
                  marginBottom: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {activeTab.title}
              </div>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  letterSpacing: "-0.005em",
                  color: "#3A3530",
                  margin: 0,
                  maxWidth: "38ch",
                }}
              >
                {activeTab.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
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
        Component.14
        <br />
        <span style={{ opacity: 0.5 }}>Select a tab</span>
      </div>
    </div>
  );
}
