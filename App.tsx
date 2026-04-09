import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PromptEditor } from './components/PromptEditor';
import { Stats } from './components/Stats';
import { ProjectList } from './components/ProjectList';
import { CalendarView } from './components/CalendarView';
import { HabitsView } from './components/HabitsView';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { SprintDashboardView } from './components/SprintDashboardView';
import {
  PromptEntry,
  Project,
  Habit,
  ViewState,
  PromptFolder,
  HabitFrequency,
  WeeklyTimeBlock,
  WeeklyAchievement,
  SprintBoard
} from './types';
import {
  INITIAL_PROMPTS,
  INITIAL_PROJECTS,
  INITIAL_HABITS,
  INITIAL_FOLDERS,
  PROJECT_COLORS,
  INITIAL_WEEKLY_BLOCKS,
  INITIAL_WEEKLY_ACHIEVEMENTS,
  INITIAL_SPRINT_BOARDS
} from './constants';
import { db } from './db';

const normalizeSprintBoards = (boards: SprintBoard[]) =>
  INITIAL_SPRINT_BOARDS.map(defaultBoard => {
    const savedBoard = boards.find(board => board.id === defaultBoard.id);
    if (!savedBoard) return defaultBoard;

    return {
      ...defaultBoard,
      ...savedBoard,
      items: savedBoard.items || []
    };
  });

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
  const [weeklyBlocks, setWeeklyBlocks] =
    useState<WeeklyTimeBlock[]>(INITIAL_WEEKLY_BLOCKS);
  const [weeklyAchievements, setWeeklyAchievements] = useState<
    WeeklyAchievement[]
  >(INITIAL_WEEKLY_ACHIEVEMENTS);
  const [sprintBoards, setSprintBoards] =
    useState<SprintBoard[]>(INITIAL_SPRINT_BOARDS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          savedPrompts,
          savedFolders,
          savedProjects,
          savedHabits,
          savedWeeklyBlocks,
          savedWeeklyAchievements,
          savedSprintBoards
        ] = await Promise.all([
          db.getAll('prompts'),
          db.getAll('folders'),
          db.getAll('projects'),
          db.getAll('habits'),
          db.getAll('weeklyBlocks'),
          db.getAll('weeklyAchievements'),
          db.getAll('sprintBoards')
        ]);

        if (savedPrompts.length) {
          setPrompts(savedPrompts);
          setActivePromptId(savedPrompts[0].id);
        }
        if (savedFolders.length) setFolders(savedFolders);
        if (savedProjects.length) setProjects(savedProjects);
        if (savedHabits.length) setHabits(savedHabits);
        if (savedWeeklyBlocks.length) setWeeklyBlocks(savedWeeklyBlocks);
        if (savedWeeklyAchievements.length) {
          setWeeklyAchievements(savedWeeklyAchievements);
        }
        if (savedSprintBoards.length) {
          setSprintBoards(normalizeSprintBoards(savedSprintBoards));
        }
      } catch (error) {
        console.error('IndexedDB load error', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    db.saveAll('prompts', prompts);
    db.saveAll('folders', folders);
    db.saveAll('projects', projects);
    db.saveAll('habits', habits);
    db.saveAll('weeklyBlocks', weeklyBlocks);
    db.saveAll('weeklyAchievements', weeklyAchievements);
    db.saveAll('sprintBoards', sprintBoards);
  }, [
    prompts,
    folders,
    projects,
    habits,
    weeklyBlocks,
    weeklyAchievements,
    sprintBoards,
    isLoaded
  ]);

  const openProjectView = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentView('projects');
  };

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
            onUpdatePrompt={prompt =>
              setPrompts(currentPrompts =>
                currentPrompts.map(item =>
                  item.id === prompt.id ? prompt : item
                )
              )
            }
            onAddPrompt={() => {
              const id = Date.now().toString();
              setPrompts(currentPrompts => [
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
                ...currentPrompts
              ]);
              setActivePromptId(id);
            }}
            onDeletePrompt={id =>
              setPrompts(currentPrompts =>
                currentPrompts.filter(prompt => prompt.id !== id)
              )
            }
            onMovePrompt={(promptId, folderId) =>
              setPrompts(currentPrompts =>
                currentPrompts.map(prompt =>
                  prompt.id === promptId
                    ? { ...prompt, folderId }
                    : prompt
                )
              )
            }
            onAddFolder={name =>
              setFolders(currentFolders => [
                ...currentFolders,
                { id: Date.now().toString(), name }
              ])
            }
            onRenameFolder={(id, name) =>
              setFolders(currentFolders =>
                currentFolders.map(folder =>
                  folder.id === id ? { ...folder, name } : folder
                )
              )
            }
            onDeleteFolder={id => {
              setFolders(currentFolders =>
                currentFolders.filter(folder => folder.id !== id)
              );
              setPrompts(currentPrompts =>
                currentPrompts.map(prompt =>
                  prompt.folderId === id
                    ? { ...prompt, folderId: undefined }
                    : prompt
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
            onUpdateProject={project =>
              setProjects(currentProjects =>
                currentProjects.map(item =>
                  item.id === project.id ? project : item
                )
              )
            }
            onAddProject={() => {
              const id = Date.now().toString();
              setProjects(currentProjects => [
                {
                  id,
                  title: 'Untitled Project',
                  description: '',
                  status: 'Not Started',
                  color:
                    PROJECT_COLORS[
                      currentProjects.length % PROJECT_COLORS.length
                    ],
                  bottlenecks: [],
                  monthlies: []
                },
                ...currentProjects
              ]);
              setActiveProjectId(id);
            }}
            onDeleteProject={id =>
              setProjects(currentProjects =>
                currentProjects.filter(project => project.id !== id)
              )
            }
          />
        );
      case 'calendar':
        return (
          <CalendarView
            projects={projects}
            onSelectProject={openProjectView}
          />
        );
      case 'weekly':
        return (
          <WeeklyPlannerView
            blocks={weeklyBlocks}
            achievements={weeklyAchievements}
            onChangeBlocks={setWeeklyBlocks}
            onChangeAchievements={setWeeklyAchievements}
          />
        );
      case 'sprintDashboard':
        return (
          <SprintDashboardView
            boards={sprintBoards}
            onChangeBoards={setSprintBoards}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={habits}
            onUpdateHabit={habit =>
              setHabits(currentHabits =>
                currentHabits.map(item =>
                  item.id === habit.id ? habit : item
                )
              )
            }
            onAddHabit={(name, freq: HabitFrequency) =>
              setHabits(currentHabits => [
                ...currentHabits,
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#191919] font-sans text-[#d4d4d4]">
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

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {!isLoaded ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}
