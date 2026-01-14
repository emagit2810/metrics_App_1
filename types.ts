
export type Metric = {
  name: string;
  value: number; // 1-10 scale
};

export interface PromptEntry {
  id: string;
  folderId?: string; // Optional folder grouping
  title: string;
  content: string;
  tags: string[];
  metrics: {
    successRate: number;      // "Rate Exit"
    hallucination: number;    // "Alucinación Rate"
    formatting: number;       // "Formato Respuesta"
    creativity: number;       // "Creatividad"
  };
  modelUsed: string;
  lastEdited: string;
}

export interface PromptFolder {
  id: string;
  name: string;
}

// Hierarchical Project Structure
export interface DailyGoal {
  id: string;
  title: string;
  done: boolean;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  done: boolean;
  dailies: DailyGoal[];
}

export interface MonthlyGoal {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  done: boolean;
  weeklies: WeeklyGoal[];
}

export interface Bottleneck {
    id: string;
    description: string;
    resolved: boolean;
}

export interface Project {
  id: string;
  title: string; // The "Final Objective"
  description: string;
  deadline?: string;
  status: 'Not Started' | 'In Progress' | 'Done';
  color: string; // Hex code or Tailwind class reference
  monthlies: MonthlyGoal[];
  bottlenecks: Bottleneck[];
}

export type HabitStatus = 'completed' | 'failed' | 'pending' | 'skipped';

export interface HabitFrequency {
    type: 'daily' | 'interval' | 'weekly';
    value: number; // e.g., interval 2 = every 2 days; weekly 2 = 2 times a week
}

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  startDate: string; // ISO Date string
  streak: number;
  history: Record<string, HabitStatus>; // Map "YYYY-MM-DD" -> Status
  comments: string;
}

export type ViewState = 'dashboard' | 'prompts' | 'projects' | 'calendar' | 'habits';
