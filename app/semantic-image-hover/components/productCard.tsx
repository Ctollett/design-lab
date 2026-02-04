
import { style } from 'framer-motion/client';
import { Segment } from '../page'
import { productMap } from '../product'


interface ProductCardProps {
  segment: Segment | null
cardRef: React.RefObject<HTMLDivElement | null>

}

export default function ProductCard({ segment, cardRef }: ProductCardProps) {

    const product = segment ? productMap[segment.label] : null

  
        return (
          <div className='absolute bg-neutral-700 p-6 rounded-xl' ref={cardRef} style={{opacity: product ? 1 : 0}}>

            {product && (
              <>
             <div className='flex flex-col'>
            <p className='text-xs'>{product.price}</p>
            <p>{product.name}</p>
            </div>
            <p>{product.brand}</p>
              </>
            )}
          </div>
        )
      }
    
    