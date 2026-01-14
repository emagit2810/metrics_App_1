
import { PromptEntry, Project, Habit, PromptFolder } from './types';

export const TAG_OPTIONS = [
  'Software', 'Solución Problemas', 'Estudiar', 'Planificar', 'Ideas', 
  'Optimización', 'Búsqueda Información', 'Resumen', 'Explicación', 'Proyecto Creación'
];

export const INITIAL_FOLDERS: PromptFolder[] = [
  { id: 'f1', name: 'Coding Helpers' },
  { id: 'f2', name: 'Content Creation' }
];

export const INITIAL_PROMPTS: PromptEntry[] = [
  {
    id: '1',
    folderId: 'f1',
    title: 'Code Refactoring Assistant',
    content: 'You are a Senior React Engineer. Refactor the following code...',
    tags: ['Software', 'Optimización'],
    metrics: { successRate: 9, hallucination: 1, formatting: 10, creativity: 4 },
    modelUsed: 'gemini-1.5-pro',
    lastEdited: 'Oct 24, 2023',
  },
  {
    id: '2',
    folderId: 'f2',
    title: 'Marketing Email Generator',
    content: 'Write a persuasive email for a SaaS product launch...',
    tags: ['Proyecto Creación', 'Ideas'],
    metrics: { successRate: 7, hallucination: 2, formatting: 8, creativity: 8 },
    modelUsed: 'gpt-4',
    lastEdited: 'Oct 22, 2023',
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Lanzar App SaaS (Objetivo Final)',
    description: 'Lograr 100 usuarios pagos para fin de año',
    status: 'In Progress',
    color: '#2563eb', // Blue
    deadline: '2026-01-31',
    bottlenecks: [],
    monthlies: [
      {
        id: 'm1',
        title: 'Desarrollo MVP (Enero)',
        description: 'Tener la base de datos y autenticación listas',
        done: false,
        deadline: '2026-01-15',
        weeklies: [
          {
            id: 'w1',
            title: 'Configuración Backend (Semana 1)',
            description: 'Setup Supabase y migraciones',
            done: true,
            dailies: [
              { id: 'd1', title: 'Diseñar Schema DB', done: true },
              { id: 'd2', title: 'Conectar API Keys', done: true }
            ]
          }
        ]
      }
    ]
  }
];

const today = new Date().toISOString().split('T')[0];
// Helper simple para generar historial mock
const mockHistory: Record<string, any> = {};
mockHistory[today] = 'pending';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'h1',
    title: 'Review Prompts',
    frequency: { type: 'daily', value: 1 },
    startDate: '2023-10-01',
    streak: 12,
    history: mockHistory,
    comments: 'Mantener consistencia en la revisión de logs.'
  },
  {
    id: 'h2',
    title: 'Read Research Paper',
    frequency: { type: 'interval', value: 2 }, // Every 2 days
    startDate: '2023-10-15',
    streak: 3,
    history: mockHistory,
    comments: ''
  }
];

export const PROJECT_COLORS = [
    '#2563eb', '#3b82f6', '#60a5fa', // Blues
    '#dc2626', '#ef4444', '#f87171', // Reds
    '#16a34a', '#22c55e', '#4ade80', // Greens
    '#9333ea', '#a855f7', '#c084fc', // Purples
    '#ea580c', '#f97316', '#fb923c', // Oranges
    '#db2777', '#ec4899', '#f472b6', // Pinks
    '#0891b2', '#06b6d4', '#22d3ee', // Cyans
    '#eab308', '#facc15', '#fef08a', // Yellows
    '#4b5563', '#9ca3af', '#e5e7eb', // Grays/Silver
];
