import { useEffect, useState, useRef } from 'react';
import { Task, ClarificationOption } from '../data';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onClarify?: (taskId: string, option: ClarificationOption) => void;
  onComplete?: (taskId: string) => void
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren : 0.023,
    }
  }
}

const childVariants = {
  hidden: { opacity: 0, y: '-12px' },
  visible: { opacity: 1, y: '0px', transition: { type: 'spring' as const, stiffness: 300, damping: 17, mass: 1 }}
}

export default function TaskCard({ task, onClarify, onComplete }: TaskCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const intervalRef = useRef<number | undefined>(undefined)
  const [showClarification, setShowClarification] = useState(false)
  const stepRef = useRef(0)
  const words = task.workingSteps![currentStepIndex].split(' ')


  useEffect(() => {
    if(task.status !== 'in_progress') return
    stepRef.current = 0
    setCurrentStepIndex(0)

      if(!task.workingSteps?.length) return
      intervalRef.current = window.setInterval(() => {
        stepRef.current += 1

        if(stepRef.current >= task.workingSteps!.length) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = undefined;
            if(task.clarification) {
              setShowClarification(true)
            } else {
            onComplete?.(task.id)
        }
          return
      }
        setCurrentStepIndex(stepRef.current)
      }, 1500);

      return () => window.clearInterval(intervalRef.current)
  }, [task.status])





  return (
    <div className='flex flex-col justify-between w-[324px] rounded-lg text-white'>
      <div className='flex flex-row items-start gap-4'>
      <div className='h-[12px] w-[12px] mt-[4px] border-1 border-neutral-500 rounded-xl'></div>
      <div className='flex flex-col gap-1'>
      <div className='text-[16px]'>
      {task.label}
      </div>
      <div className='text-[12px] min-h-[16px] overflow-hidden flex flex-col gap-4'>
       {task.status == 'in_progress' && (
          <motion.div key={currentStepIndex} variants={containerVariants} initial="hidden" animate="visible">
      {words.map((word, index) => (
        <motion.span style={{ display: 'inline-block', marginRight: '0.25em', backfaceVisibility: 'hidden', willChange: 'transform, opacity' }} variants={childVariants} key={index}>{word}</motion.span>
      
       ))}
      </motion.div>
       )
      }

      {showClarification && task.clarification && task.status == 'in_progress' && (
        <motion.div className='flex flex-col gap-2' key={`clarification-${currentStepIndex}`} variants={containerVariants} initial="hidden" animate="visible">
        <motion.span style={{ display: 'inline-block', marginRight: '0.25em', backfaceVisibility: 'hidden', willChange: 'transform, opacity' }} variants={childVariants} className='text-[14px]'>{task.clarification.question}</motion.span> 
        <div className='flex flex-row gap-4'>
        {task.clarification.options.map(option => (
          <button className='border-1 p-1 rounded-sm text-[8px]' key={option.id} onClick={() => onClarify?.(task.id, option)}>
          {option.label}
          </button>
    
        ))}
        </div>
       </motion.div>
      )}
      </div>
      </div>
      </div>
    </div>
  );
}
