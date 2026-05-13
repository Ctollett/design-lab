"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { RuunSVG } from "ruun-react";
import { LabCanvas } from "@/components";

const PENCIL_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
  <path d="m15 5 4 4"/>
</svg>`

const LOADER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#FF6E00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v4"/>
  <path d="m16.2 7.8 2.9-2.9"/>
  <path d="M18 12h4"/>
  <path d="m16.2 16.2 2.9 2.9"/>
  <path d="M12 18v4"/>
  <path d="m4.9 19.1 2.9-2.9"/>
  <path d="M2 12h4"/>
  <path d="m4.9 4.9 2.9 2.9"/>
</svg>`

type Status = "idle" | "loading" | "preview";

const randomLetter = () => {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  return characters.charAt(Math.floor(Math.random() * characters.length));
};

function useSpinningText() {
  const textNodeRef = useRef<Text | null>(null);
  const originalTextRef = useRef<string>("");
  const targetTextRef = useRef<string>("");
  const phaseRef = useRef<"idle" | "ramping-up" | "ramping-down" | "settled">("idle");
  const activeIndicesRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const startOffsetRef = useRef<number>(0);
  const selectionLengthRef = useRef<number>(0);

  const startSpinning = (range: Range) => {
    let node = range.startContainer;
    const selectedText = range.toString();

    if (node.nodeType !== Node.TEXT_NODE) {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      node = walker.nextNode() || node;
    }

    const textNode = node as Text;
    const fullText = textNode.data;
    const parent = textNode.parentElement;

    const before = fullText.slice(0, range.startOffset);
    const selected = selectedText;
    const after = fullText.slice(range.startOffset + selectedText.length);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode(before));

    const span = document.createElement("span");
    span.style.color = "#999";
    span.style.filter = "blur(2px)";
    span.textContent = selected;
    fragment.appendChild(span);

    fragment.appendChild(document.createTextNode(after));

    if (parent) {
      parent.replaceChild(fragment, textNode);
    }

    textNodeRef.current = span.firstChild as Text;
    originalTextRef.current = selected;

    const leadingSpaces = (selectedText.match(/^(\s*)/) || [""])[0].length;
    const trailingSpaces = (selectedText.match(/(\s*)$/) || [""])[0].length;
    const contentLength = selectedText.length - leadingSpaces - trailingSpaces;

    startOffsetRef.current = leadingSpaces;
    selectionLengthRef.current = contentLength;
    phaseRef.current = "ramping-up";

    for (let i = 0; i < contentLength; i++) {
      const timeout = setTimeout(() => {
        activeIndicesRef.current.add(leadingSpaces + i);
      }, i * 20);
      timeoutsRef.current.push(timeout);
    }

    intervalRef.current = setInterval(() => {
      if (textNodeRef.current && textNodeRef.current.data) {
        const chars = textNodeRef.current.data.split("");
        activeIndicesRef.current.forEach((i) => {
          if (i < chars.length && chars[i] !== " ") {
            chars[i] = randomLetter();
          }
        });
        textNodeRef.current.data = chars.join("");
      }
    }, 20);
  };

  const settleToText = (text: string, onSettled?: () => void) => {
    targetTextRef.current = text;

    if (textNodeRef.current) {
      const original = textNodeRef.current.data;
      const before = original.slice(0, startOffsetRef.current);
      const after = original.slice(startOffsetRef.current + selectionLengthRef.current);
      textNodeRef.current.data = before + text + after;
    }

    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
    phaseRef.current = "ramping-down";

    activeIndicesRef.current = new Set(
      Array.from({ length: text.length }, (_, i) => startOffsetRef.current + i)
    );

    for (let i = 0; i < text.length; i++) {
      const timeout = setTimeout(() => {
        activeIndicesRef.current.delete(startOffsetRef.current + i);

        if (textNodeRef.current) {
          const chars = textNodeRef.current.data.split("");
          chars[startOffsetRef.current + i] = text[i];
          textNodeRef.current.data = chars.join("");
        }

        if (i === text.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          phaseRef.current = "settled";

          if (textNodeRef.current && textNodeRef.current.parentNode) {
            const greySpan = textNodeRef.current.parentNode as HTMLElement;
            const grandparent = greySpan.parentNode;
            const fullText = textNodeRef.current.data;
            const before = fullText.slice(0, startOffsetRef.current);
            const improved = fullText.slice(
              startOffsetRef.current,
              startOffsetRef.current + text.length
            );
            const after = fullText.slice(startOffsetRef.current + text.length);

            const fragment = document.createDocumentFragment();
            fragment.appendChild(document.createTextNode(before));

            const span = document.createElement("span");
            span.className = "text-orange-500";
            span.textContent = improved;
            fragment.appendChild(span);

            fragment.appendChild(document.createTextNode(after));

            if (grandparent) {
              grandparent.replaceChild(fragment, greySpan);
            }

            if (onSettled) onSettled();
          }
        }
      }, i * 50);
      timeoutsRef.current.push(timeout);
    }
  };

  return { startSpinning, settleToText };
}

export default function InlineAutoSuggest() {
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [selectedText, setSelectedText] = useState("");
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null);

  const selectionRangeRef = useRef<Range | null>(null);
  const isSubmittingRef = useRef(false);
  const { startSpinning, settleToText } = useSpinningText();

  const handleAccept = () => {
    const span = document.querySelector(".text-orange-500");
    if (!span) return;

    const textNode = document.createTextNode(span.textContent || "");
    const parent = span.parentNode;

    if (parent) {
      parent.replaceChild(textNode, span);
      parent.normalize();
    }

    isSubmittingRef.current = false;
    setButtonPosition(null);
    setStatus("idle");
  };

  const handleReject = () => {
    const span = document.querySelector(".text-orange-500");
    if (!span) return;

    const textNode = document.createTextNode(selectedText || "");
    const parent = span.parentNode;

    if (parent) {
      parent.replaceChild(textNode, span);
      parent.normalize();
    }

    isSubmittingRef.current = false;
    setButtonPosition(null);
    setStatus("idle");
  };

  const handleAIButton = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (selectionRect) {
      setButtonPosition({ top: selectionRect.top - 50, left: selectionRect.left });
    }

    if (selectionRangeRef.current) {
      startSpinning(selectionRangeRef.current);
    }

    if (selectedText.length === 0) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/ai/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to improve text");
      }

      const data = await response.json();
      const improvedText = data.improvedText.replace(/^"|"$/g, "");

      settleToText(improvedText, () => {
        setStatus("preview");
      });
    } catch (error) {
      console.error("Error improving text:", error);
      setStatus("idle");
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (status !== "idle" || isSubmittingRef.current) return;

      const selection = window.getSelection();

      if (selection && selection.toString().length > 0 && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionRect(rect);
        setSelectedText(selection.toString());
        selectionRangeRef.current = range.cloneRange();
      } else {
        setSelectionRect(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [status]);

  const buttonTransition = { type: "spring" as const, stiffness: 120, damping: 20 };
  const buttonInitial = { opacity: 0, y: -8, filter: "blur(2px)" };
  const buttonAnimate = { opacity: 1, y: 0, filter: "blur(0px)" };
  const buttonExit = { opacity: 0, y: -8, filter: "blur(2px)" };

  return (
    <LabCanvas bg="#f5f5f4">
      <div className="relative w-full h-[350px] flex flex-col items-start justify-center p-4">
        <div className="absolute top-4 left-4 flex flex-row items-center gap-2 text-neutral-400">
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
            <path d="M9 4h6" />
            <path d="M12 4v16" />
            <path d="M9 20h6" />
          </svg>
          <span className="text-[10px] tracking-wide">
            Select text to improve
          </span>
        </div>

          <div className="flex flex-col gap-4 mb-8 w-full max-w-[600px]">
            <AnimatePresence>
              {((selectionRect && status === "idle") || status === "loading") && (
                <motion.div
                  key="ai-button"
                  initial={buttonInitial}
                  animate={buttonAnimate}
                  exit={buttonExit}
                  transition={buttonTransition}
                  onMouseDown={() => { isSubmittingRef.current = true; }}
                  onClick={status === "idle" ? handleAIButton : undefined}
                  className="p-2 rounded-lg w-[36px] h-[36px] flex items-center justify-center shadow-lg overflow-hidden"
                  style={{
                    position: "fixed",
                    top: buttonPosition ? buttonPosition.top : selectionRect ? selectionRect.top - 50 : 0,
                    left: buttonPosition ? buttonPosition.left : selectionRect ? selectionRect.left : 0,
                    cursor: status === "loading" ? "default" : "pointer",
                    backgroundColor: '#28282B',
                  }}
                  whileHover={status === "idle" ? { scale: 1.08, y: -1 } : undefined}
                >
                  <RuunSVG
                    from={PENCIL_SVG}
                    to={LOADER_SVG}
                    active={status === "loading"}
                    className="w-[22px] h-[22px]"
                  />
                </motion.div>
              )}

              {status === "preview" && buttonPosition && (
                <motion.div
                  key="preview-buttons"
                  initial={{ opacity: 0, y: -8, filter: "blur(5px)" }}
                  animate={buttonAnimate}
                  exit={{ opacity: 0, y: -8, filter: "blur(5px)" }}
                  transition={buttonTransition}
                  className="flex gap-1.5"
                  style={{
                    position: "fixed",
                    top: buttonPosition.top,
                    left: buttonPosition.left,
                  }}
                >
                  <motion.div
                    onClick={handleAccept}
                    className="rounded-lg w-[36px] h-[36px] flex items-center justify-center cursor-pointer shadow-lg text-sm text-white"
                    style={{ backgroundColor: '#FF6E00' }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0 }}
                    whileHover={{ scale: 1.06, y: -1 }}
                  >
                    ✓
                  </motion.div>
                  <motion.div
                    onClick={handleReject}
                    className="rounded-lg w-[36px] h-[36px] flex items-center justify-center cursor-pointer shadow-lg text-sm"
                    style={{ backgroundColor: '#cccccc', color: '#1a1a1a' }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
                    whileHover={{ scale: 1.06, y: -1 }}
                  >
                    ✕
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="outline-none text-xl text-neutral-800 w-full"
              contentEditable="true"
              suppressContentEditableWarning
              data-placeholder="Enter text here..."
            />
          </div>
        </div>
    </LabCanvas>
  );
}
