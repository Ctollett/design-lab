"use client";
import { useEffect, useState } from 'react'
import { initialTasks, prompt } from './data';
import TaskCard from './components/TaskCard'
import { LabCanvas } from "@/components";

export default function ProgressiveConfidenceAgentTasks() {
  const [task, setTasks] = useState(initialTasks)


  function handleTaskComplete(taskId: string) {
    setTasks(prevTasks => {
      const nextTask = prevTasks.find(t => t.status === 'pending')
      return prevTasks.map(task => {
        if(task.id === taskId) {
          return { ...task, status: 'complete'}
        } else if(task.id === nextTask?.id) {
          return { ...task, status: 'in_progress'}
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
        <ul className='flex flex-col gap-4'>
          {task.map((task, index) => {
           return <li key={index}><TaskCard task={task} onComplete={handleTaskComplete} onClarify={handleTaskComplete}/></li>
          })}        
        </ul>
      </div>
      </div>
    </LabCanvas>
  );
}
