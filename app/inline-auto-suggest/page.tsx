"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import AI from "../../images/noun-ai-7315703.svg";
import { LabCanvas } from "@/components";

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

    textNodeRef.current = node as Text;
    originalTextRef.current = range.toString();

    const leadingSpaces = (selectedText.match(/^(\s*)/) || [""])[0].length;
    const trailingSpaces = (selectedText.match(/(\s*)$/) || [""])[0].length;
    const contentStart = range.startOffset + leadingSpaces;
    const contentLength = selectedText.length - leadingSpaces - trailingSpaces;

    startOffsetRef.current = contentStart;
    selectionLengthRef.current = contentLength;
    phaseRef.current = "ramping-up";

    for (let i = 0; i < contentLength; i++) {
      const timeout = setTimeout(() => {
        activeIndicesRef.current.add(contentStart + i);
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
            const parent = textNodeRef.current.parentNode;
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
            span.className = "text-blue-600";
            span.textContent = improved;
            fragment.appendChild(span);

            fragment.appendChild(document.createTextNode(after));
            parent.replaceChild(fragment, textNodeRef.current);

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
  const { startSpinning, settleToText } = useSpinningText();

  const handleAccept = () => {
    const span = document.querySelector(".text-blue-600");
    if (!span) return;

    const textNode = document.createTextNode(span.textContent || "");
    const parent = span.parentNode;

    if (parent) {
      parent.replaceChild(textNode, span);
      parent.normalize();
    }

    setStatus("idle");
  };

  const handleReject = () => {
    const span = document.querySelector(".text-blue-600");
    if (!span) return;

    const textNode = document.createTextNode(selectedText || "");
    const parent = span.parentNode;

    if (parent) {
      parent.replaceChild(textNode, span);
      parent.normalize();
    }

    setStatus("idle");
  };

  const handleAIButton = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (selectionRect) {
      setButtonPosition({ top: selectionRect.top - 65, left: selectionRect.left });
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
      if (status !== "idle") return;

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

  const buttonTransition = { type: "spring" as const, stiffness: 500, damping: 18 };
  const buttonInitial = { opacity: 0, y: -8, filter: "blur(2px)" };
  const buttonAnimate = { opacity: 1, y: 0, filter: "blur(0px)" };
  const buttonExit = { opacity: 0, y: -8, filter: "blur(2px)" };

  return (
    <LabCanvas bg="#f5f5f4">
      <div className="relative w-full max-w-[500px] h-[350px] flex flex-col items-center justify-center p-4">
          <div className="flex flex-col gap-4 mb-8">
            <AnimatePresence>
              {selectionRect && status === "idle" && (
                <motion.div
                  key="idle-button"
                  initial={buttonInitial}
                  animate={buttonAnimate}
                  exit={buttonExit}
                  transition={buttonTransition}
                  onClick={handleAIButton}
                  className="bg-neutral-800 text-white p-4 rounded-xl w-[48px] h-[48px] flex items-center justify-center shadow-lg cursor-pointer"
                  style={{
                    position: "fixed",
                    top: selectionRect.top - 65,
                    left: selectionRect.left,
                  }}
                >
                  <AI style={{ width: 32, height: 32 }} />
                </motion.div>
              )}

              {status === "loading" && buttonPosition && (
                <motion.div
                  key="loading-button"
                  initial={buttonInitial}
                  animate={buttonAnimate}
                  exit={buttonExit}
                  transition={buttonTransition}
                  className="bg-neutral-400 opacity-50 text-white p-4 rounded-xl w-[48px] h-[48px] flex items-center justify-center shadow-lg"
                  style={{
                    position: "fixed",
                    top: buttonPosition.top,
                    left: buttonPosition.left,
                  }}
                >
                  <AI style={{ width: 32, height: 32 }} />
                </motion.div>
              )}

              {status === "preview" && buttonPosition && (
                <motion.div
                  key="preview-buttons"
                  initial={{ opacity: 0, y: -8, filter: "blur(5px)" }}
                  animate={buttonAnimate}
                  exit={{ opacity: 0, y: -8, filter: "blur(5px)" }}
                  transition={buttonTransition}
                  className="flex gap-2"
                  style={{
                    position: "fixed",
                    top: buttonPosition.top + 25,
                    left: buttonPosition.left,
                  }}
                >
                  <div
                    onClick={handleReject}
                    className="bg-neutral-500 text-white p-4 rounded-xl w-[24px] h-[24px] flex items-center justify-center cursor-pointer shadow-lg"
                  >
                    ✕
                  </div>
                  <div
                    onClick={handleAccept}
                    className="bg-blue-500 text-white p-4 rounded-xl w-[24px] h-[24px] flex items-center justify-center cursor-pointer shadow-lg"
                  >
                    ✓
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="outline-none text-xl text-neutral-800"
              contentEditable="true"
              suppressContentEditableWarning
            >
              Enter text here
            </div>
          </div>
        </div>
    </LabCanvas>
  );
}
