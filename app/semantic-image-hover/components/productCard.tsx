import { Segment } from '../page'
import { productMap } from '../product'
import { motion } from 'framer-motion'


interface ProductCardProps {
  segment: Segment | null
  cardRef: React.RefObject<HTMLDivElement | null>
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
        className="backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25),inset_1px_0_1px_rgba(255,255,255,0.06),inset_-1px_0_1px_rgba(0,0,0,0.15)] text-white"
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ overflow: 'hidden' }}
        animate={{
          backgroundColor: product ? product.color : 'rgba(0, 0, 0, 0.6)',
          width: product ? '240px' : '16px',
          height: product ? '100px' : '16px',
          borderRadius: product ? '16px' : '12px',
          padding: product ? '14px' : '0px'
        }}
      >
        <motion.div
          style={{ width: '212px' }}
          animate={{ opacity: product ? 1 : 0, filter: product ? 'blur(0px)' : 'blur(4px)' }}
          transition={{ duration: 0.3 }}
        >
          {product && (
            <div className="flex flex-col h-full justify-between">
              {/* Top: Brand */}
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">{product.brand}</p>

              {/* Middle: Name & Rating */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold leading-tight">{product.name}</p>
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} />
                  <span className="text-[10px] text-white/50">({product.reviews})</span>
                </div>
              </div>

              {/* Bottom: Price */}
              <p className="text-base font-bold">{product.price}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
    
    