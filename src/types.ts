export interface HistoryItem {
  id: string;
  tool: string; // e.g., 'json', 'base64', 'jwt', 'regex', 'hash', 'uuid', 'diff'
  timestamp: number;
  input: string;
  output: string;
  label?: string; // Optional user note or quick description
  metadata?: Record<string, any>;
}

export interface BackgroundJob {
  id: string;
  name: string;
  tool: string;
  progress: number; // 0 to 100
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  result?: any;
  error?: string;
}

export type ToolType =
  | 'home'
  | 'json'
  | 'base64'
  | 'url'
  | 'jwt'
  | 'regex'
  | 'hash'
  | 'uuid'
  | 'diff'
  | 'rest'
  | 'pem'
  | 'markdown'
  | 'timestamp'
  | 'cron'
  | 'curl'
  | 'color'
  | 'sql'
  | 'escaper'
  | 'chmod';
