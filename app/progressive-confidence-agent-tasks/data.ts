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
  workingSteps?: string[];
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
    status: 'in_progress',
    workingSteps: [
      'Analyzing meeting context...',
      'Structuring message...',
      'Polishing draft...',
    ],
  },
  {
    id: '2',
    label: 'Pull calendar details for tomorrow',
    confidence: 'high',
    status: 'pending',
    workingSteps: [
      'Connecting to calendar...',
      'Fetching tomorrow\'s events...',
      'Extracting meeting details...',
    ],
  },
  {
    id: '3',
    label: "Look up John's email address",
    confidence: 'medium',
    status: 'pending',
    workingSteps: [
      'Searching contacts...',
      'Found multiple matches...',
    ],
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
    workingSteps: [
      'Composing final email...',
      'Attaching meeting details...',
      'Ready to send...',
    ],
    clarification: {
      question: 'Send now?',
      options: [
        { id: 'preview', label: 'View Preview' },
        { id: 'send', label: 'Send Email' },
      ],
    },
  },
];
