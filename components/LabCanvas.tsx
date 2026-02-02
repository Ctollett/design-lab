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
 */

interface LabCanvasProps {
  children: React.ReactNode;
  /** Optional background color (defaults to transparent) */
  bg?: string;
}

export default function LabCanvas({ children, bg }: LabCanvasProps) {
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