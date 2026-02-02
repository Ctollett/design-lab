'use client';

import { useSearchParams } from 'next/navigation';

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

export default function LabCanvas({ children, bg }: LabCanvasProps) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.has('preview');

  if (isPreview) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          width: '700px',
          height: '450px',
          backgroundColor: bg || '#0a0a0a',
        }}
      >
        <div className="w-[650px] h-[420px] flex items-center justify-center">
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
