import { useEffect, useState, useRef } from 'react';
import { Task, ClarificationOption } from '../data';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidCircle from './LiquidCircle';

interface TaskCardProps {
  task: Task;
  onClarify?: (taskId: string, option: ClarificationOption) => void;
  onComplete?: (taskId: string) => void;
  showConnector?: boolean;
  connectorActive?: boolean;
  receivingDroplet?: boolean;
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

export default function TaskCard({ task, onClarify, onComplete, showConnector = false, connectorActive = false, receivingDroplet = false }: TaskCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const intervalRef = useRef<number | undefined>(undefined)
  const [showClarification, setShowClarification] = useState(false)
  const stepRef = useRef(0)
  const words = task.workingSteps?.[currentStepIndex]?.split(' ') || []
  const [justCompleted, setJustCompleted] = useState(false)

  const totalSteps = task.workingSteps?.length || 1;
  // Tasks with clarification cap at 50% until complete
  const maxProgress = task.clarification ? 0.5 : 1;
  const stepProgress = (currentStepIndex + 1) / totalSteps;
  const progress = task.status === 'complete'
    ? 1
    : task.status === 'in_progress'
      ? Math.min(stepProgress * maxProgress, maxProgress)
      : 0;


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


  useEffect(() => {

   if(task.status === 'complete') {
    setJustCompleted(true)

     const timeout = setTimeout(() => {
      setJustCompleted(false)
    }, 500)

       return () => {
      clearTimeout(timeout)
    }

   }


  },[task.status])


  return (
    <div className='flex flex-col w-[324px] text-white'>
      <div className='flex flex-row items-start gap-4'>
        <div className='flex flex-col items-center'>
          <div className='mt-[4px]'>
            <LiquidCircle
              progress={progress}
              status={task.status}
              size={12}
              sloshing={showClarification}
              draining={false}
              receivingDroplet={receivingDroplet}
              justCompleted={justCompleted}
            />
          </div>

          {/* Connector spacer - the actual drop animation is in LiquidCircle */}
          {showConnector && connectorActive && (
            <div className='h-[44px] mt-1' />
          )}
        </div>

        <div className='flex flex-col gap-1'>
          <div style={{ filter: task.status === 'complete' && !justCompleted ? 'blur(1px)' : 'none' }}
className={`text-[16px] transition-all duration-500  ${ justCompleted ? 'text-green-400' : task.status === 'complete' ? 'text-zinc-900' :  showClarification ? 'text-red-400' : ''} ` }
>
            {task.label}
          </div>
          <div className='text-[12px] min-h-[16px] flex flex-col gap-8 mb-8'>
            {task.status == 'in_progress' && (
              <motion.div key={currentStepIndex} variants={containerVariants} initial="hidden" animate="visible">
                {words.map((word, index) => (
                  <motion.span style={{ display: 'inline-block', marginRight: '0.25em', backfaceVisibility: 'hidden', willChange: 'transform, opacity' }} variants={childVariants} key={index}>{word}</motion.span>
                ))}
              </motion.div>
            )}

            {showClarification && task.clarification && task.status == 'in_progress' && (
              <motion.div
                className='flex flex-col gap-2'
                key={`clarification-${currentStepIndex}`}
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
                initial="hidden"
                animate="visible"
              >
                <motion.span
                  style={{ display: 'inline-block', backfaceVisibility: 'hidden', willChange: 'transform, opacity' }}
                  variants={childVariants}
                  className='text-[14px]'
                >
                  {task.clarification.question}
                </motion.span>
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
                  }}
                  className='flex flex-row gap-4'
                >
                  {task.clarification.options.map(option => (
                    <motion.button
                      variants={childVariants}
                      className='border-1 p-1 rounded-sm text-[8px] hover:bg-white hover:text-zinc-900 cursor-pointer transition-colors duration-250'
                      key={option.id}
                      onClick={() => onClarify?.(task.id, option)}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
