'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * LabCanvas - Template for all design lab experiments
 *
 * This provides a consistent canvas that fits within the portfolio iframe.
 *
 * Portfolio iframe dimensions: ~700px wide × 450px tall
 *
 * GUIDELINES FOR BUILDING LABS:
 * - Design your lab to fit within 90vh × 90vw (leaving padding)
 * - Use percentage-based or viewport-relative sizing
 * - Avoid fixed pixel sizes larger than ~600px × 400px
 * - The canvas automatically centers content
 *
 * PREVIEW MODE:
 * - Add ?preview to the URL to render at exactly 700×450
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
    // Recording area is 716x466 (8px bleed on each side for rounded corners)
    // Inner guides show 700x450 visible area after rounded corner clipping
    const bleed = 8;
    const width = 700;
    const height = 450;
    const recordWidth = width + bleed * 2;
    const recordHeight = height + bleed * 2;

    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: `${recordWidth}px`,
            height: `${recordHeight}px`,
            backgroundColor: bg || '#0a0a0a',
            border: '2px dashed #ff4444',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
            borderRadius: '8px',
          }}
        >
          {/* Corner guides showing where rounded corners will clip */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#ff4444] rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#ff4444] rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#ff4444] rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#ff4444] rounded-br-lg" />

          {/* Dimension label */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[#ff4444] text-xs font-mono">
            {recordWidth} × {recordHeight} (record this)
          </div>

          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden p-4"
      style={{ backgroundColor: bg || 'transparent' }}
    >
      {/* Safe area for lab content - 90% of viewport with max constraints */}
      <div className="w-[90vw] h-[90vh] max-w-[650px] max-h-[420px] flex items-center justify-center">
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
