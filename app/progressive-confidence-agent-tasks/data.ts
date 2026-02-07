export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'needs_clarification' | 'complete';

export interface ClarificationOption {
  id: string;
  label: string;
}

export interface Task {
  id: string;
  label: string;
  confidence: ConfidenceLevel;
  status: TaskStatus;
  dependsOn?: string[];
  clarification?: {
    question: string;
    options: ClarificationOption[];
  };
}

export const prompt = "Email John about the meeting tomorrow";

export const initialTasks: Task[] = [
  {
    id: '1',
    label: 'Draft meeting reminder message',
    confidence: 'high',
    status: 'pending',
  },
  {
    id: '2',
    label: 'Pull calendar details for tomorrow',
    confidence: 'high',
    status: 'pending',
  },
  {
    id: '3',
    label: "Look up John's email address",
    confidence: 'medium',
    status: 'pending',
    clarification: {
      question: 'Which John?',
      options: [
        { id: 'smith', label: 'John Smith' },
        { id: 'doe', label: 'John Doe' },
      ],
    },
  },
  {
    id: '4',
    label: 'Send email',
    confidence: 'low',
    status: 'pending',
    dependsOn: ['1', '2', '3'],
  },
];
