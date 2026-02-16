'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * LabCanvas - Template for all design lab experiments
 *
 * This provides a consistent canvas that fits within the portfolio iframe.
 *
 * Portfolio iframe dimensions: 580px wide × 450px tall
 * (Portfolio body is max-w-[628px] with px-6 padding = 580px content area)
 *
 * GUIDELINES FOR BUILDING LABS:
 * - Design your lab to fit within ~550px × 420px (leaving padding)
 * - Use percentage-based or viewport-relative sizing
 * - Avoid fixed pixel sizes larger than ~520px × 400px
 * - The canvas automatically centers content
 *
 * PREVIEW MODE:
 * - Add ?preview to the URL to render at portfolio size with bleed
 * - Use this mode for consistent screen recordings
 * - Example: /spacial-filter?preview
 */

interface LabCanvasProps {
  children: React.ReactNode;
  /** Optional background color (defaults to transparent) */
  bg?: string;
}

function LabCanvasInner({ children, bg }: LabCanvasProps) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.has('preview');

  if (isPreview) {
    // Preview mode with guides for recording
    // Larger than portfolio container (580x450) with 24px bleed on each side
    const bleed = 24;
    const width = 580 + bleed * 2;  // 628
    const height = 450 + bleed * 2; // 498

    return (
      <div
        className="w-screen h-screen flex items-center justify-center"
        style={{ background: bg || 'transparent' }}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            border: '2px dashed #ff4444',
          }}
        >
          {/* Dimension label */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[#ff4444] text-xs font-mono">
            {width} × {height} ({bleed}px bleed)
          </div>

          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden p-4"
      style={{ background: bg || 'transparent' }}
    >
      {/* Safe area for lab content - matches portfolio iframe (580x450 minus padding) */}
      <div className="w-[90vw] h-[90vh] max-w-[550px] max-h-[420px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function LabCanvas({ children, bg }: LabCanvasProps) {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ backgroundColor: bg || 'transparent' }} />}>
      <LabCanvasInner bg={bg}>{children}</LabCanvasInner>
    </Suspense>
  );
}
