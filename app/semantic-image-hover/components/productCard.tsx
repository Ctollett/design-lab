
import { style } from 'framer-motion/client';
import { Segment } from '../page'
import { productMap } from '../product'
import { motion } from 'framer-motion'


interface ProductCardProps {
  segment: Segment | null
cardRef: React.RefObject<HTMLDivElement | null>

}

export default function ProductCard({ segment, cardRef }: ProductCardProps) {

    const product = segment ? productMap[segment.label] : null

  
        return (
          <div ref={cardRef} style={{position: 'fixed', top: 0, left: 0, pointerEvents: 'none'}}>
            <motion.div className='backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.25),inset_1px_0_1px_rgba(255,255,255,0.06),inset_-1px_0_1px_rgba(0,0,0,0.15)] text-white' transition={{ type: "spring", stiffness: 200, damping: 20 }} style={{overflow: 'hidden'}} animate={{backgroundColor: product ? product.color : 'rgba(0, 0, 0, 0.6)', width: product ? '224px' : '16px', height: product ? '100px' : '16px', borderRadius: product ? '16px' : '12px', padding: product ? '12px' : '0px'}}>

              <motion.div
                style={{ width: '224px' }}
                animate={{ opacity: product ? 1 : 0, filter: product ? 'blur(0px)' : 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                {product && (
                  <>
                    <div className='flex flex-col'>
                      <p className='text-xs'>{product.price}</p>
                      <p>{product.name}</p>
                    </div>
                    <p>{product.brand}</p>
                  </>
                )}
              </motion.div>

            </motion.div>
          </div>
        )
      }
    
    