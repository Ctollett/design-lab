import { Task, ClarificationOption } from '../data';

interface TaskCardProps {
  task: Task;
  onClarify?: (taskId: string, option: ClarificationOption) => void;
}

export default function TaskCard({ task, onClarify }: TaskCardProps) {
  return (
    <div className='flex justify-between w-[324px] border-1 border-block rounded-lg p-2 items-center text-black'>
      <div className='text-[12px]'>
      {task.label}
      </div>
      <div className='text-[8px]'>
      {task.confidence}
      </div>
    </div>
  );
}
