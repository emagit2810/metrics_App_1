
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptEditor } from './components/PromptEditor';
import { Stats } from './components/Stats';
import { ProjectList } from './components/ProjectList';
import { CalendarView } from './components/CalendarView';
import { HabitsView } from './components/HabitsView';
import { PromptEntry, Project, Habit, ViewState, PromptFolder, HabitFrequency } from './types';
import { INITIAL_PROMPTS, INITIAL_PROJECTS, INITIAL_HABITS, INITIAL_FOLDERS, PROJECT_COLORS } from './constants';
import { CheckSquare, Share, MoreHorizontal, Plus, Loader2 } from 'lucide-react';
import { db } from './db';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('prompts');
  const [prompts, setPrompts] = useState<PromptEntry[]>(INITIAL_PROMPTS);
  const [folders, setFolders] = useState<PromptFolder[]>(INITIAL_FOLDERS);
  const [activePromptId, setActivePromptId] = useState<string>(INITIAL_PROMPTS[0].id);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. CARGA INICIAL DESDE INDEXEDDB
  useEffect(() => {
    async function loadData() {
      try {
        const [savedPrompts, savedFolders, savedProjects, savedHabits] = await Promise.all([
          db.getAll('prompts'),
          db.getAll('folders'),
          db.getAll('projects'),
          db.getAll('habits')
        ]);

        if (savedPrompts.length > 0) {
          setPrompts(savedPrompts);
          setActivePromptId(savedPrompts[0].id);
        }
        if (savedFolders.length > 0) setFolders(savedFolders);
        if (savedProjects.length > 0) setProjects(savedProjects);
        if (savedHabits.length > 0) setHabits(savedHabits);

      } catch (error) {
        console.error("Error loading data from IndexedDB", error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // 2. PERSISTENCIA AUTOMÁTICA
  useEffect(() => {
    if (isLoaded) {
      db.saveAll('prompts', prompts);
      db.saveAll('folders', folders);
      db.saveAll('projects', projects);
      db.saveAll('habits', habits);
    }
  }, [prompts, folders, projects, habits, isLoaded]);

  // Prompt Handlers
  const handleUpdatePrompt = (updated: PromptEntry) => {
    setPrompts(prompts.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddPrompt = () => {
      const newId = Date.now().toString();
      const newPrompt: PromptEntry = {
          id: newId,
          title: '',
          content: '',
          tags: [],
          metrics: { successRate: 0, hallucination: 0, formatting: 0, creativity: 0 }, 
          modelUsed: '',
          lastEdited: new Date().toLocaleDateString()
      };
      setPrompts([newPrompt, ...prompts]);
      setActivePromptId(newId);
  };

  const handleDeletePrompt = (id: string) => {
      const remaining = prompts.filter(p => p.id !== id);
      setPrompts(remaining);
      if(activePromptId === id && remaining.length > 0) setActivePromptId(remaining[0].id);
  }

  const handleMovePrompt = (promptId: string, folderId: string | undefined) => {
      setPrompts(prompts.map(p => p.id === promptId ? {...p, folderId} : p));
  }

  // Folder Handlers
  const handleAddFolder = (name: string) => {
      setFolders([...folders, { id: Date.now().toString(), name }]);
  };

  const handleRenameFolder = (id: string, name: string) => {
      setFolders(folders.map(f => f.id === id ? {...f, name} : f));
  };

  const handleDeleteFolder = (id: string) => {
      setPrompts(prompts.map(p => p.folderId === id ? {...p, folderId: undefined} : p));
      setFolders(folders.filter(f => f.id !== id));
  };

  // Project Handlers
  const handleUpdateProject = (updated: Project) => {
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProject = (id: string) => {
      setProjects(projects.filter(p => p.id !== id));
      if(activeProjectId === id) {
          setActiveProjectId(undefined);
          setCurrentView('projects');
      }
  };

  const handleAddProject = () => {
      const newId = Date.now().toString();
      const newProject: Project = {
          id: newId,
          title: 'Untitled Project',
          description: 'Define your main objective...',
          status: 'Not Started',
          color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
          bottlenecks: [],
          monthlies: [
              {
                  id: `m-${newId}`,
                  title: 'Month 1',
                  description: 'First milestone',
                  done: false,
                  weeklies: [
                      {
                          id: `w-${newId}`,
                          title: 'Week 1',
                          description: 'Kickoff',
                          done: false,
                          dailies: []
                      }
                  ]
              }
          ]
      };
      setProjects([newProject, ...projects]);
      setActiveProjectId(newId);
      setCurrentView('projects');
  };

  const handleSelectProject = (projectId: string) => {
      setActiveProjectId(projectId);
      setCurrentView('projects');
  };

  // Habit Handlers
  const handleUpdateHabit = (updated: Habit) => {
      setHabits(habits.map(h => h.id === updated.id ? updated : h));
  };

  const handleAddHabit = (name: string, frequency: HabitFrequency) => {
      const newHabit: Habit = {
          id: Date.now().toString(),
          title: name,
          frequency,
          startDate: new Date().toISOString().split('T')[0],
          streak: 0,
          history: {},
          comments: ''
      };
      setHabits([...habits, newHabit]);
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-[#191919] flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-notion-muted text-sm font-medium tracking-widest animate-pulse">CARGANDO TU ESPACIO...</span>
      </div>
    );
  }

  // View Router
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Stats prompts={prompts} habits={habits} />;
      case 'prompts':
        return (
          <PromptEditor 
            activePrompt={prompts.find(p => p.id === activePromptId) || null}
            prompts={prompts}
            folders={folders}
            onSelectPrompt={setActivePromptId}
            onUpdatePrompt={handleUpdatePrompt}
            onAddPrompt={handleAddPrompt}
            onAddFolder={handleAddFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onDeletePrompt={handleDeletePrompt}
            onMovePrompt={handleMovePrompt}
          />
        );
      case 'projects':
        return (
            <ProjectList 
                projects={projects} 
                activeProjectId={activeProjectId}
                onUpdateProject={handleUpdateProject} 
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
            />
        );
      case 'calendar':
        return <CalendarView projects={projects} onSelectProject={handleSelectProject} />;
      case 'habits':
        return (
             <HabitsView 
                habits={habits}
                onUpdateHabit={handleUpdateHabit}
                onAddHabit={handleAddHabit}
             />
        );
      default:
        return <div>Select a page</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#191919] text-[#d4d4d4] overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { setCurrentView(view); if(view !== 'projects') setActiveProjectId(undefined); }} 
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projects={projects}
        onSelectProject={handleSelectProject}
        activeProjectId={activeProjectId}
      />
      
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ${!sidebarOpen ? 'ml-0' : ''}`}>
        {/* Top Breadcrumb Bar */}
        <div className="h-12 border-b border-notion-border flex items-center justify-between px-4 bg-[#191919]">
           <div className="flex items-center gap-2 text-sm text-notion-text">
                {!sidebarOpen && (
                    <button onClick={() => setSidebarOpen(true)} className="mr-2 hover:bg-notion-hover p-1 rounded">
                        <span className="text-lg">☰</span>
                    </button>
                )}
                <span className="opacity-50">Private</span>
                <span className="opacity-50">/</span>
                <span className="font-medium capitalize">{currentView}</span>
                {currentView === 'prompts' && (
                    <>
                        <span className="opacity-50">/</span>
                        <span className="truncate max-w-[200px]">{prompts.find(p => p.id === activePromptId)?.title}</span>
                    </>
                )}
                {currentView === 'projects' && activeProjectId && (
                     <>
                        <span className="opacity-50">/</span>
                        <span className="truncate max-w-[200px]">{projects.find(p => p.id === activeProjectId)?.title}</span>
                    </>
                )}
           </div>
           
           <div className="flex items-center gap-1 text-notion-text">
               <button className="p-1 hover:bg-notion-hover rounded text-notion-muted hover:text-notion-text text-sm px-2">Edited just now</button>
               <button className="p-1 hover:bg-notion-hover rounded text-notion-muted hover:text-notion-text">
                   <Share size={16} />
               </button>
               <button className="p-1 hover:bg-notion-hover rounded text-notion-muted hover:text-notion-text">
                   <MoreHorizontal size={16} />
               </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
