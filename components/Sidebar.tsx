
import React, { useState } from 'react';
import { LayoutDashboard, Sparkles, FolderKanban, CheckSquare, Search, Settings, PlusCircle, ChevronsLeft, Menu, CalendarDays, ChevronDown, ChevronRight, Hash, ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';
import { ViewState, Project } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  activeProjectId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, onChangeView, isOpen, toggleSidebar, projects, onSelectProject, activeProjectId 
}) => {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  if (!isOpen) {
    return (
        <div className="absolute top-4 left-4 z-50 animate-fade-in">
            <button 
                onClick={toggleSidebar} 
                className="bg-[#202020] border border-notion-border p-2 hover:bg-notion-hover rounded-md text-notion-muted hover:text-white shadow-lg transition-colors group"
                title="Expand Sidebar"
            >
                <ArrowRightFromLine size={20} className="group-hover:scale-110 transition-transform" />
            </button>
        </div>
    )
  }

  const NavItem = ({ view, icon: Icon, label, isActive }: { view: ViewState; icon: any; label: string, isActive?: boolean }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors ${
        (isActive || currentView === view)
          ? 'bg-notion-hover text-notion-text font-medium'
          : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="h-screen w-64 bg-notion-sidebar border-r border-notion-border flex flex-col flex-shrink-0 transition-all duration-300 relative shadow-2xl z-40">
      
      {/* Botón de colapso explícito con flecha */}
      <button 
        onClick={toggleSidebar} 
        className="absolute -right-3 top-6 bg-[#202020] border border-notion-border rounded-full p-1 text-notion-muted hover:text-white hover:bg-blue-600 shadow-md z-50 transition-all hover:scale-110"
        title="Collapse Sidebar"
      >
          <ChevronsLeft size={14} />
      </button>

      {/* Header */}
      <div className="p-4 flex items-center gap-2 text-notion-text font-semibold select-none">
          <div className="w-5 h-5 bg-orange-700 rounded text-xs flex items-center justify-center text-white font-bold shadow-sm">E</div>
          <span className="truncate">Emmanuel's Workspace</span>
      </div>

      {/* Quick Actions */}
      <div className="px-2 mb-4 space-y-1">
        <div className="flex items-center gap-2 px-3 py-1 text-notion-muted hover:bg-notion-hover rounded-md text-sm cursor-pointer transition-colors">
          <Search size={16} />
          <span>Search</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 text-notion-muted hover:bg-notion-hover rounded-md text-sm cursor-pointer transition-colors">
          <Settings size={16} />
          <span>Settings</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <div className="px-3 py-1 text-xs font-semibold text-notion-muted mt-4 mb-1 uppercase tracking-wider">
          Favorites
        </div>
        <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />

        <div className="px-3 py-1 text-xs font-semibold text-notion-muted mt-6 mb-1 uppercase tracking-wider">
          Private
        </div>
        <NavItem view="prompts" icon={Sparkles} label="Prompt Lab" />
        
        {/* Projects Section */}
        <div className="space-y-0.5">
            <button 
                onClick={() => {
                    onChangeView('projects');
                    setIsProjectsExpanded(!isProjectsExpanded);
                }}
                className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors group ${currentView === 'projects' && !activeProjectId ? 'bg-notion-hover text-notion-text' : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}`}
            >
                 <div className="flex items-center gap-3 flex-1">
                     <FolderKanban size={18} />
                     <span>Projects</span>
                 </div>
                 {isProjectsExpanded ? <ChevronDown size={14} className="opacity-50"/> : <ChevronRight size={14} className="opacity-50"/>}
            </button>
            
            {isProjectsExpanded && (
                <div className="ml-4 pl-2 border-l border-notion-border space-y-0.5 mt-1 animate-fade-in">
                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => {
                                onChangeView('projects');
                                onSelectProject(project.id);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                                activeProjectId === project.id 
                                ? 'text-blue-400 bg-blue-500/10 font-medium' 
                                : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
                            }`}
                        >
                            <Hash size={14} />
                            <span className="truncate">{project.title}</span>
                        </button>
                    ))}
                    <button 
                         onClick={() => onChangeView('projects')} 
                         className="w-full text-left px-3 py-1 text-xs text-notion-muted/50 hover:text-notion-muted hover:bg-notion-hover rounded transition-colors"
                    >
                        + New Project
                    </button>
                </div>
            )}
        </div>

        <NavItem view="calendar" icon={CalendarDays} label="Calendar" />
        <NavItem view="habits" icon={CheckSquare} label="Habits" />
      </div>
      
      {/* Footer / Notion AI Hint */}
      <div className="p-3 border-t border-notion-border bg-[#1d1d1d]">
          <div className="flex items-center gap-2 text-notion-muted text-xs hover:text-notion-text cursor-pointer transition-colors p-1 rounded hover:bg-notion-hover">
              <Sparkles size={14} className="text-purple-400 animate-pulse"/>
              <span>Ask AI Assistant...</span>
          </div>
      </div>
    </div>
  );
};
