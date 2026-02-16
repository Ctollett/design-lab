'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useId } from 'react';

interface LiquidCircleProps {
  progress: number;
  status: 'pending' | 'in_progress' | 'complete' | 'needs_clarification';
  size?: number;
  sloshing?: boolean;
  draining?: boolean;
  receivingDroplet?: boolean;
  justCompleted?: boolean;
}

export default function LiquidCircle({ progress, status, size = 12, sloshing = false, draining = false, receivingDroplet = false, justCompleted = false }: LiquidCircleProps) {
  const isComplete = status === 'complete';
  const rawId = useId();
  const clipId = rawId.replace(/:/g, '_'); // Sanitize for CSS url() compatibility

  // Track settling wobble when progress changes
  const [isSettling, setIsSettling] = useState(false);
  const prevProgressRef = useRef(progress);
  useEffect(() => {
    if (progress !== prevProgressRef.current && status === 'in_progress') {
      setIsSettling(true);
      const timer = setTimeout(() => setIsSettling(false), 1000);
      prevProgressRef.current = progress;
      return () => clearTimeout(timer);
    }
  }, [progress, status]);

  const fillProgress = draining ? 0 : isComplete ? 1 : sloshing ? 0.5 : progress;
  // Circle goes from y=3 (top) to y=21 (bottom), wave crests are at y=0 in local coords
  // liquidY ranges from 22 (empty, crests hidden below circle) to -5 (full, wave fills circle)
  const liquidY = 22 - (fillProgress * 27);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size, overflow: 'visible' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="12" cy="12" r="9" />
          </clipPath>
          {/* Primary liquid gradient - blue to silver shimmer */}
          <linearGradient id={`${clipId}-liquid`} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="25%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="75%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          {/* Secondary shimmer highlight layer */}
          <linearGradient id={`${clipId}-highlight`} gradientUnits="userSpaceOnUse" x1="22" y1="2" x2="2" y2="22">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#93c5fd" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
          </linearGradient>
          {/* Complete state gradient - blue to silver */}
          <linearGradient id={`${clipId}-complete`} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="25%" stopColor="#bbf7d0" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id={`${clipId}-complete-highlight`} gradientUnits="userSpaceOnUse" x1="22" y1="2" x2="2" y2="22">
            <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#86efac" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.3" />
          </linearGradient>
          {/* Grey completed state gradient - deep lava lamp look */}
          <linearGradient id={`${clipId}-grey`} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
            <stop offset="0%" stopColor="#a1a1aa" />
            <stop offset="15%" stopColor="#52525b" />
            <stop offset="35%" stopColor="#3f3f46" />
            <stop offset="50%" stopColor="#27272a" />
            <stop offset="65%" stopColor="#18181b" />
            <stop offset="80%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
          <linearGradient id={`${clipId}-grey-highlight`} gradientUnits="userSpaceOnUse" x1="22" y1="2" x2="2" y2="22">
            <stop offset="0%" stopColor="#71717a" stopOpacity="0.7" />
            <stop offset="25%" stopColor="#52525b" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#3f3f46" stopOpacity="0.6" />
            <stop offset="75%" stopColor="#27272a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0.3" />
          </linearGradient>
          {/* Red clarification state gradient */}
          <linearGradient id={`${clipId}-red`} gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="25%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id={`${clipId}-red-highlight`} gradientUnits="userSpaceOnUse" x1="22" y1="2" x2="2" y2="22">
            <stop offset="0%" stopColor="#fef2f2" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#fecaca" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#fca5a5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Border circle */}
        <motion.circle
          cx="12"
          cy="12"
          r="10.5"
          fill="none"
          initial={{ stroke: 'rgb(115, 115, 115)' }}
          animate={{
            stroke: justCompleted ? 'rgba(74, 222, 128, 0.8)' : isComplete ? 'rgba(113, 113, 122, 0.6)' : sloshing ? 'rgba(239, 68, 68, 0.8)' : 'rgba(148, 163, 184, 0.6)'
          }}
          transition={{ duration: 0.3, delay: draining ? 0.6 : 0 }}
          strokeWidth="1"
        />

        {/* Falling droplet with blue neon glow - starts from connector line */}
        {receivingDroplet && (
          <>
            <defs>
              <filter id={`${clipId}-neon`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.5" result="blur1" />
                <feGaussianBlur stdDeviation="3" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <motion.path
              fill="#60a5fa"
              style={{ filter: 'drop-shadow(0 0 3px #3b82f6) drop-shadow(0 0 6px #60a5fa)' }}
              initial={{
                d: "M 12 -90 Q 14 -86, 14.5 -83 Q 15 -80, 12 -78 Q 9 -80, 9.5 -83 Q 10 -86, 12 -90 Z",
              }}
              animate={{
                d: [
                  "M 12 -90 Q 14 -86, 14.5 -83 Q 15 -80, 12 -78 Q 9 -80, 9.5 -83 Q 10 -86, 12 -90 Z",
                  "M 12 14 Q 14 16, 14.5 17 Q 15 18, 12 19 Q 9 18, 9.5 17 Q 10 16, 12 14 Z",
                  "M 12 17 Q 16 18, 18 19 Q 18 20, 12 20 Q 6 20, 6 19 Q 8 18, 12 17 Z",
                ],
              }}
              transition={{
                duration: 0.55,
                times: [0, 0.75, 1],
                ease: [0.4, 0, 1, 1],
              }}
            />
          </>
        )}

        {/* Single wave element - always rendered, never unmounts */}
        {status !== 'pending' && (
          <g clipPath={`url(#${clipId})`}>
            <motion.g
              initial={{ y: 22 }}
              animate={{
                y: liquidY,
                rotate: sloshing ? [0, 3, -3, 2, -2, 0] : isSettling ? [0, 4, -3, 2, -1, 0] : 0,
              }}
              transition={{
                y: {
                  type: 'spring',
                  stiffness: 100,
                  damping: 12,
                  mass: 0.8,
                  delay: receivingDroplet ? 0.5 : 0,
                },
                rotate: sloshing
                  ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                  : isSettling
                    ? { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
                    : { duration: 0.3 }
              }}
              style={{ originX: '12px', originY: '12px' }}
            >
              <motion.path
                d="M -8 3 Q -4 0, 0 3 T 8 3 T 16 3 T 24 3 T 32 3 L 32 50 L -8 50 Z"
                fill={`url(#${clipId}-${justCompleted ? 'complete' : isComplete ? 'grey' : sloshing ? 'red' : 'liquid'})`}
                animate={{
                  x: sloshing ? [-6, 6, -6] : (isComplete && !justCompleted) ? [-4, 4, -4] : [-8, 0],
                  scaleY: (isComplete && !justCompleted) ? [1, 1.15, 1, 0.9, 1] : 1,
                }}
                transition={{
                  x: sloshing
                    ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    : (isComplete && !justCompleted)
                      ? { duration: 8, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 1.5, repeat: Infinity, ease: 'linear' },
                  scaleY: (isComplete && !justCompleted)
                    ? { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0 },
                }}
              />
              <motion.path
                d="M -8 4 Q -4 1.5, 0 4 T 8 4 T 16 4 T 24 4 T 32 4 L 32 50 L -8 50 Z"
                fill={`url(#${clipId}-${justCompleted ? 'complete-highlight' : isComplete ? 'grey-highlight' : sloshing ? 'red-highlight' : 'highlight'})`}
                animate={{
                  x: sloshing ? [4, -4, 4] : (isComplete && !justCompleted) ? [3, -3, 3] : [0, -8],
                  scaleY: (isComplete && !justCompleted) ? [1, 0.92, 1, 1.1, 1] : 1,
                }}
                transition={sloshing ? {
                  x: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                } : (isComplete && !justCompleted) ? {
                  x: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
                  scaleY: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                } : {
                  x: { duration: 1.2, repeat: Infinity, ease: 'linear' },
                }}
              />
            </motion.g>
          </g>
        )}
      </svg>
    </div>
  );
}
