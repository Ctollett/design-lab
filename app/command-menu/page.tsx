"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import styles from "./command-menu.module.css";

// ── Data ──────────────────────────────────────────────────────────────────────

type Item = {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  danger?: boolean;
};

const ALL_ITEMS: Item[] = [
  { id: "group",         label: "Group Selection",  shortcut: "⌘G",   category: "Layer" },
  { id: "autolayout",    label: "Add Auto Layout",  shortcut: "⇧A",   category: "Layer" },
  { id: "wrapframe",     label: "Wrap in Frame",    shortcut: "⌘⌥G",  category: "Layer" },
  { id: "rename",        label: "Rename Layer",     shortcut: "⌘R",   category: "Layer" },
  { id: "lock",          label: "Lock Layer",       shortcut: "⌘⇧L",  category: "Layer" },
  { id: "flatten",       label: "Flatten",          shortcut: "⌘E",   category: "Layer" },
  { id: "component",     label: "Create Component", shortcut: "⌘⌥K",  category: "Component" },
  { id: "detach",        label: "Detach Instance",                      category: "Component" },
  { id: "resetinstance", label: "Reset Instance",                       category: "Component" },
  { id: "swapcomponent", label: "Swap Component",                       category: "Component" },
  { id: "copysvg",       label: "Copy as SVG",                          category: "Edit" },
  { id: "copypng",       label: "Copy as PNG",                          category: "Edit" },
  { id: "copycss",       label: "Copy as CSS",                          category: "Edit" },
  { id: "pasteinplace",  label: "Paste in Place",   shortcut: "⌘⇧V",  category: "Edit" },
  { id: "delete",        label: "Delete",           shortcut: "⌫",    category: "Edit", danger: true },
  { id: "export",        label: "Export…",          shortcut: "⌘⇧E",  category: "Export" },
  { id: "zoomfit",       label: "Zoom to Fit",      shortcut: "⇧1",   category: "View" },
  { id: "grid",          label: "Toggle Grid",      shortcut: "⌘'",   category: "View" },
  { id: "rulers",        label: "Toggle Rulers",    shortcut: "⇧R",   category: "View" },
];

const INITIAL_IDS = ["group", "autolayout", "component", "detach", "flatten", "export"];
const INITIAL_ITEMS = ALL_ITEMS.filter(i => INITIAL_IDS.includes(i.id));

function filterItems(query: string): Item[] {
  if (!query.trim()) return INITIAL_ITEMS;
  const q = query.toLowerCase();
  return ALL_ITEMS.filter(i =>
    i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
  );
}

function groupItems(items: Item[]): [string, Item[]][] {
  const map = new Map<string, Item[]>();
  items.forEach(item => {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category)!.push(item);
  });
  return Array.from(map.entries());
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="5" cy="5" r="3.5" stroke="rgba(255,255,247,0.3)" strokeWidth="1.2" />
      <line x1="7.8" y1="7.8" x2="10.5" y2="10.5" stroke="rgba(255,255,247,0.3)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandMenuPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const highlightY = useSpring(0, { stiffness: 500, damping: 36 });
  const highlightOpacity = useMotionValue(0);

  const filtered = filterItems(query);
  const grouped = groupItems(filtered);

  useEffect(() => {
    if (!hoveredId) {
      highlightOpacity.set(0);
      return;
    }
    const el = itemRefs.current[hoveredId];
    const list = listRef.current;
    if (!el || !list) return;
    highlightY.set(el.offsetTop);
    highlightOpacity.set(1);
  }, [hoveredId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuery("");
        setIsSearching(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setIsSearching(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearchClick = () => {
    setIsSearching(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClear = () => {
    setQuery("");
    setIsSearching(false);
    inputRef.current?.blur();
  };

  return (
    <div className={styles.page}>

      <motion.div
        className={styles.menu}
        layout
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
      >
        {/* Search row */}
        <AnimatePresence>
          {isSearching ? (
            <motion.div
              key="search"
              className={styles.searchRow}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 36 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            >
              <SearchIcon />
              <input
                ref={inputRef}
                className={styles.searchInput}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands…"
              />
              {query && (
                <button className={styles.clearBtn} onClick={handleClear}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="rgba(255,255,247,0.3)" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="rgba(255,255,247,0.3)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="hint"
              className={styles.hintRow}
              onClick={handleSearchClick}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SearchIcon />
              <span className={styles.hintText}>Search commands…</span>
            </motion.button>
          )}
        </AnimatePresence>

        <div className={styles.menuDivider} />

        {/* Items list */}
        <div className={styles.list} ref={listRef}>
          <motion.div
            className={styles.highlight}
            style={{ y: highlightY, opacity: highlightOpacity }}
          />

          <AnimatePresence mode="popLayout">
            {isSearching ? (
              filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  className={styles.empty}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No results
                </motion.div>
              ) : (
                grouped.map(([cat, items]) => (
                  <motion.div key={cat} layout>
                    <motion.div
                      className={styles.categoryLabel}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {cat}
                    </motion.div>
                    {items.map(item => (
                      <MenuItem
                        key={item.id}
                        item={item}
                        isHovered={hoveredId === item.id}
                        onHover={setHoveredId}
                        itemRef={el => { itemRefs.current[item.id] = el; }}
                      />
                    ))}
                  </motion.div>
                ))
              )
            ) : (
              INITIAL_ITEMS.map((item, i) => (
                <motion.div key={item.id} layout>
                  {i === 4 && <div className={styles.itemDivider} />}
                  <MenuItem
                    item={item}
                    isHovered={hoveredId === item.id}
                    onHover={setHoveredId}
                    itemRef={el => { itemRefs.current[item.id] = el; }}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className={styles.cornerLabel}>
        Component.11<br />
        <span style={{ opacity: 0.5 }}>Command Menu</span>
      </div>

    </div>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────────

type MenuItemProps = {
  item: Item;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  itemRef: (el: HTMLDivElement | null) => void;
};

function MenuItem({ item, onHover, itemRef }: MenuItemProps) {
  return (
    <div
      ref={itemRef}
      className={`${styles.item} ${item.danger ? styles.itemDanger : ""}`}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      <span className={styles.itemLabel}>{item.label}</span>
      {item.shortcut && (
        <span className={styles.shortcut}>{item.shortcut}</span>
      )}
    </div>
  );
}
