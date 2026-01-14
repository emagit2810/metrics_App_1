import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptEditor } from './components/PromptEditor';
import { Stats } from './components/Stats';
import { ProjectList } from './components/ProjectList';
import { CalendarView } from './components/CalendarView';
import { HabitsView } from './components/HabitsView';
import {
  PromptEntry,
  Project,
  Habit,
  ViewState,
  PromptFolder,
  HabitFrequency
} from './types';
import {
  INITIAL_PROMPTS,
  INITIAL_PROJECTS,
  INITIAL_HABITS,
  INITIAL_FOLDERS,
  PROJECT_COLORS
} from './constants';
import { Share, MoreHorizontal, Loader2 } from 'lucide-react';
import { db } from './db';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('prompts');
  const [prompts, setPrompts] = useState<PromptEntry[]>(INITIAL_PROMPTS);
  const [folders, setFolders] = useState<PromptFolder[]>(INITIAL_FOLDERS);
  const [activePromptId, setActivePromptId] = useState<string>(
    INITIAL_PROMPTS[0]?.id
  );
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  /* =========================
     CARGA DESDE INDEXEDDB
     ========================= */
  useEffect(() => {
    async function loadData() {
      try {
        const [savedPrompts, savedFolders, savedProjects, savedHabits] =
          await Promise.all([
            db.getAll('prompts'),
            db.getAll('folders'),
            db.getAll('projects'),
            db.getAll('habits')
          ]);

        if (savedPrompts.length) {
          setPrompts(savedPrompts);
          setActivePromptId(savedPrompts[0].id);
        }
        if (savedFolders.length) setFolders(savedFolders);
        if (savedProjects.length) setProjects(savedProjects);
        if (savedHabits.length) setHabits(savedHabits);
      } catch (e) {
        console.error('IndexedDB load error', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  /* =========================
     PERSISTENCIA
     ========================= */
  useEffect(() => {
    if (!isLoaded) return;
    db.saveAll('prompts', prompts);
    db.saveAll('folders', folders);
    db.saveAll('projects', projects);
    db.saveAll('habits', habits);
  }, [prompts, folders, projects, habits, isLoaded]);

  /* =========================
     RENDER DE VISTAS
     ========================= */
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Stats prompts={prompts} habits={habits} />;
      case 'prompts':
        return (
          <PromptEditor
            activePrompt={
              prompts.find(p => p.id === activePromptId) || null
            }
            prompts={prompts}
            folders={folders}
            onSelectPrompt={setActivePromptId}
            onUpdatePrompt={p =>
              setPrompts(ps => ps.map(x => (x.id === p.id ? p : x)))
            }
            onAddPrompt={() => {
              const id = Date.now().toString();
              setPrompts(p => [
                {
                  id,
                  title: '',
                  content: '',
                  tags: [],
                  metrics: {
                    successRate: 0,
                    hallucination: 0,
                    formatting: 0,
                    creativity: 0
                  },
                  modelUsed: '',
                  lastEdited: new Date().toLocaleDateString()
                },
                ...p
              ]);
              setActivePromptId(id);
            }}
            onDeletePrompt={id =>
              setPrompts(p => p.filter(x => x.id !== id))
            }
            onMovePrompt={(pid, fid) =>
              setPrompts(p =>
                p.map(x => (x.id === pid ? { ...x, folderId: fid } : x))
              )
            }
            onAddFolder={name =>
              setFolders(f => [...f, { id: Date.now().toString(), name }])
            }
            onRenameFolder={(id, name) =>
              setFolders(f =>
                f.map(x => (x.id === id ? { ...x, name } : x))
              )
            }
            onDeleteFolder={id => {
              setFolders(f => f.filter(x => x.id !== id));
              setPrompts(p =>
                p.map(x =>
                  x.folderId === id ? { ...x, folderId: undefined } : x
                )
              );
            }}
          />
        );
      case 'projects':
        return (
          <ProjectList
            projects={projects}
            activeProjectId={activeProjectId}
            onUpdateProject={p =>
              setProjects(ps => ps.map(x => (x.id === p.id ? p : x)))
            }
            onAddProject={() => {
              const id = Date.now().toString();
              setProjects(ps => [
                {
                  id,
                  title: 'Untitled Project',
                  description: '',
                  status: 'Not Started',
                  color: PROJECT_COLORS[ps.length % PROJECT_COLORS.length],
                  bottlenecks: [],
                  monthlies: []
                },
                ...ps
              ]);
              setActiveProjectId(id);
            }}
            onDeleteProject={id =>
              setProjects(p => p.filter(x => x.id !== id))
            }
          />
        );
      case 'calendar':
        return (
          <CalendarView
            projects={projects}
            onSelectProject={setActiveProjectId}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={habits}
            onUpdateHabit={h =>
              setHabits(x => x.map(y => (y.id === h.id ? h : y)))
            }
            onAddHabit={(name, freq: HabitFrequency) =>
              setHabits(h => [
                ...h,
                {
                  id: Date.now().toString(),
                  title: name,
                  frequency: freq,
                  startDate: new Date().toISOString().split('T')[0],
                  streak: 0,
                  history: {},
                  comments: ''
                }
              ])
            }
          />
        );
      default:
        return null;
    }
  };

  /* =========================
     RENDER PRINCIPAL
     ========================= */
  return (
    <div className="flex h-screen w-full bg-[#191919] text-[#d4d4d4] overflow-hidden font-sans">
      <Sidebar
        currentView={currentView}
        onChangeView={view => {
          setCurrentView(view);
          if (view !== 'projects') setActiveProjectId(undefined);
        }}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projects={projects}
        onSelectProject={setActiveProjectId}
        activeProjectId={activeProjectId}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!isLoaded ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
