"use client";
import { useState } from 'react'
import { initialTasks, prompt } from './data';
import TaskCard from './components/TaskCard'
import { LabCanvas } from "@/components";

export default function ProgressiveConfidenceAgentTasks() {
  const [task, setTasks] = useState(initialTasks)
  return (
    <LabCanvas bg="#FFFFFF">
      <div className='flex flex-col gap-8'>
      <div className="text-black text-[24px]">
       <p>{prompt}</p>
      </div>
      <div>
        <ul className='flex flex-col gap-4'>
          {initialTasks.map((task, index) => {
           return <li key={index}><TaskCard task={task}/></li>
          })}        
        </ul>
      </div>
      </div>
    </LabCanvas>
  );
}
