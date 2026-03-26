export type ProcessStatus = 'normal' | 'delay' | 'stop';
export type UserRole = 'master' | 'manager' | 'worker';
export type WorkerTaskState = 'waiting' | 'working' | 'paused';

export interface Project {
  id: string;
  name: string;
  targetQuantity?: number;
  targetDate?: string; // YYYY-MM-DD
  startDate?: string;  // YYYY-MM-DD
}

export interface FactoryProcess {
  id: string;
  projectId: string;
  name: string;
  status: ProcessStatus;
  worker?: string;
  inventory: number;
  avgTime: number;
  currentTime: number;
  description: string;
  requiredAmount: number;
}

export interface Worker {
  id: string;
  loginId?: string;
  password?: string;
  role: UserRole;
  
  projectId: string;
  name: string;
  department: string;
  skillLevel: number;
  currentProcessId?: string;
  avatar: string;
  
  // Real-time task execution
  taskState?: WorkerTaskState;
  assignedQuantity?: number;
  completedQuantity?: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'voice' | 'photo' | 'manual' | 'system' | 'defect';
  content: string;
  processId: string;
  imageUrl?: string;
  defectQuantity?: number;
}

export interface HelpSignal {
  id: string;
  workerName: string;
  message: string;
  timestamp: Date;
  processId: string;
}
