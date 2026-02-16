"use client";
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { initialTasks, prompt } from './data';
import TaskCard from './components/TaskCard'
import { LabCanvas } from "@/components";

export default function ProgressiveConfidenceAgentTasks() {
  const [tasks, setTasks] = useState(initialTasks)
  const [receivingDropletId, setReceivingDropletId] = useState<string | null>(null)

  const allTasksComplete = tasks.every(task => task.status === 'complete')

  function handleTaskComplete(taskId: string) {
    setTasks(prevTasks => {
      const nextTask = prevTasks.find(t => t.status === 'pending')

      // Track which task is receiving the droplet
      if (nextTask) {
        setReceivingDropletId(nextTask.id)
        // Clear after animation completes
        setTimeout(() => setReceivingDropletId(null), 1500)
      }

      return prevTasks.map(task => {
        if(task.id === taskId) {
          return { ...task, status: 'complete' as const }
        } else if(task.id === nextTask?.id) {
          return { ...task, status: 'in_progress' as const }
        } else {
          return task
        }
      })
    })
  }

  return (
    <LabCanvas bg="transparent">
      <div
        className='absolute inset-0'
        style={{ background: 'linear-gradient(203deg, rgba(0, 0, 0, 1) 0%, rgba(20, 23, 23, 1) 100%)' }}
      />
      <div className='flex flex-col gap-8 relative'>
        {/* Label */}
        <div className="flex flex-row items-center gap-2 text-white/40">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-[10px] tracking-wide">
            Non-interactive preview
          </span>
        </div>

        <div
          className="p-[1px] rounded-xl"
          style={{
            background: 'linear-gradient(90deg, rgba(60,60,65,0.3) 0%, rgba(220,220,225,0.6) 20%, rgba(255,255,255,0.8) 25%, rgba(220,220,225,0.6) 30%, rgba(60,60,65,0.3) 50%, rgba(220,220,225,0.6) 70%, rgba(255,255,255,0.8) 75%, rgba(220,220,225,0.6) 80%, rgba(60,60,65,0.3) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 12s ease-in-out infinite',
          }}
        >
          <div className="text-neutral-600 text-[20px] bg-zinc-950 p-4 rounded-xl flex flex-row items-center gap-4">
            <p>{prompt}</p>
            <div className='h-[24px] w-[24px] rounded-sm text-zinc-500 flex justify-center items-center opacity-50' style={{ background: 'linear-gradient(135deg, rgba(120,120,120,0.3) 0%, rgba(80,80,80,0.2) 100%)' }}>↑</div>
          </div>
        </div>
        <div>
          <ul className='flex flex-col'>
            {tasks.map((task, index) => {
              const isLastTask = index === tasks.length - 1;
              const isComplete = task.status === 'complete';
              const isReceivingDroplet = task.id === receivingDropletId;

              return (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    onComplete={handleTaskComplete}
                    onClarify={handleTaskComplete}
                    showConnector={!isLastTask}
                    connectorActive={isComplete}
                    receivingDroplet={isReceivingDroplet}
                  />
                </li>
              )
            })}
          </ul>

          <AnimatePresence>
            {allTasksComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-4 -mt-4"
              >
                <div className="w-[12px] flex justify-center" style={{ overflow: 'visible' }}>
                  <svg
                    width="20"
                    height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="email-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#71717a">
                        <animate attributeName="stop-color" values="#71717a;#d4d4d8;#a1a1aa;#71717a" dur="3s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="50%" stopColor="#d4d4d8">
                        <animate attributeName="stop-color" values="#d4d4d8;#f4f4f5;#d4d4d8;#a1a1aa" dur="3s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#a1a1aa">
                        <animate attributeName="stop-color" values="#a1a1aa;#71717a;#d4d4d8;#a1a1aa" dur="3s" repeatCount="indefinite" />
                      </stop>
                    </linearGradient>
                  </defs>
                  <path
                    d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
                    stroke="url(#email-gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  </svg>
                </div>
                <span
                  className="text-[16px] font-medium"
                  style={{
                    background: 'linear-gradient(90deg, #71717a 0%, #d4d4d8 25%, #f4f4f5 50%, #d4d4d8 75%, #71717a 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                >
                  Email Sent
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LabCanvas>
  );
}
