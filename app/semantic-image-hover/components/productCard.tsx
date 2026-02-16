import { Segment } from '../page'
import { productMap } from '../product'
import { motion } from 'framer-motion'


interface ProductCardProps {
  segment: Segment | null
  cardRef: React.RefObject<HTMLDivElement | null>
}

const categoryIcons: Record<string, React.ReactNode> = {
  "couch": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
      <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
      <path d="M4 18v2" />
      <path d="M20 18v2" />
    </svg>
  ),
  "light": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v1" />
      <path d="M12 7a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.4V18h4v-3.6c1.2-.6 2-1.9 2-3.4a4 4 0 0 0-4-4Z" />
    </svg>
  ),
  "potted plant": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  "book": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  "cup": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="star-half-gradient">
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
          </linearGradient>
        </defs>
      </svg>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3 h-3"
          viewBox="0 0 20 20"
          fill={star <= Math.floor(rating) ? "#ffffff" : star - 0.5 <= rating ? "url(#star-half-gradient)" : "rgba(255,255,255,0.3)"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductCard({ segment, cardRef }: ProductCardProps) {
  const product = segment ? productMap[segment.label] : null

  return (
    <div ref={cardRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}>
      <motion.div
        className="backdrop-blur-md text-white"
        transition={product
          ? { type: "spring", stiffness: 400, damping: 25 }
          : { type: "spring", stiffness: 500, damping: 35 }
        }
        style={{ overflow: 'hidden' }}
        animate={{
          backgroundColor: product ? product.color : 'rgba(0, 0, 0, 0.6)',
          width: product ? '280px' : '16px',
          height: product ? '100px' : '16px',
          borderRadius: product ? '16px' : '12px',
          padding: product ? '10px' : '0px',
          boxShadow: product
            ? '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.25)'
            : '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)'
        }}
      >
        <motion.div
          style={{ width: '260px' }}
          animate={{ opacity: product ? 1 : 0, filter: product ? 'blur(0px)' : 'blur(4px)' }}
          transition={{ duration: 0.25, delay: product ? 0.15 : 0 }}
        >
          {product && segment && (
            <div className="flex gap-3 h-[80px]">
              {/* Product thumbnail */}
              <div className="w-[80px] h-[80px] rounded-lg flex-shrink-0 bg-white/10 overflow-hidden p-1.5">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>

              {/* Product info */}
              <div className="relative flex flex-col flex-1 justify-between py-0.5">
                {/* Category icon tab - top right */}
                <div className="absolute top-0 right-0 flex items-center justify-center text-white/70">
                  {categoryIcons[segment.label]}
                </div>

                {/* Top: Brand */}
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">{product.brand}</p>

                {/* Middle: Name & Rating */}
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold leading-tight">{product.name}</p>
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={product.rating} />
                    <span className="text-[10px] text-white/50">({product.reviews})</span>
                  </div>
                </div>

                {/* Bottom: Price */}
                <p className="text-base font-bold">{product.price}</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
    
    