
import React, { useState } from 'react';
import { Tag, Save, Folder, FolderPlus, Plus, Trash2, Edit2, ArrowRight, Sparkles, GripVertical } from 'lucide-react';
import { PromptEntry, PromptFolder } from '../types';
import { TAG_OPTIONS } from '../constants';

interface PromptEditorProps {
  activePrompt: PromptEntry | null;
  prompts: PromptEntry[];
  folders: PromptFolder[];
  onSelectPrompt: (id: string) => void;
  onUpdatePrompt: (prompt: PromptEntry) => void;
  onAddPrompt: () => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onMovePrompt: (promptId: string, folderId: string | undefined) => void;
}

interface MetricSliderProps {
    label: string;
    value: number;
    color: string;
    metricKey: keyof PromptEntry['metrics'];
    description?: string;
    onMetricChange: (metric: keyof PromptEntry['metrics'], value: number) => void;
}

const MetricSlider: React.FC<MetricSliderProps> = ({ label, value, color, metricKey, description, onMetricChange }) => (
    <div className="flex flex-col py-3 group">
      <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-notion-muted">
             <span className="text-sm font-medium text-notion-text">{label}</span>
             {description && <span className="text-[10px] opacity-50 hidden group-hover:block transition-opacity">{description}</span>}
          </div>
          <span className={`text-sm font-mono font-bold ${color}`}>{value ?? 0}/10</span>
      </div>
      <div className="relative w-full h-6 flex items-center">
        <div className="absolute w-full h-1.5 bg-notion-border rounded-full overflow-hidden">
             <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{width: `${(value ?? 0) * 10}%`}}></div>
        </div>
        <input 
            type="range" 
            min="0" 
            max="10" 
            step="1"
            value={value ?? 0}
            onChange={(e) => onMetricChange(metricKey, parseInt(e.target.value, 10))}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );

export const PromptEditor: React.FC<PromptEditorProps> = ({ 
    activePrompt, prompts, folders, onSelectPrompt, onUpdatePrompt, onAddPrompt, onAddFolder,
    onRenameFolder, onDeleteFolder, onDeletePrompt, onMovePrompt
}) => {
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  // Drag and Drop State
  const [draggingPromptId, setDraggingPromptId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, promptId: string) => {
      setDraggingPromptId(promptId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, folderId: string | undefined) => {
      e.preventDefault();
      if(draggingPromptId) {
          onMovePrompt(draggingPromptId, folderId);
          setDraggingPromptId(null);
      }
  };

  const handleMetricChange = (metric: keyof PromptEntry['metrics'], value: number) => {
    if(!activePrompt) return;
    onUpdatePrompt({
      ...activePrompt,
      metrics: {
        ...activePrompt.metrics,
        [metric]: Number(value)
      }
    });
  };

  const handleSave = () => {
    const btn = document.getElementById('save-btn');
    if(btn) {
        btn.innerHTML = "Saved!";
        setTimeout(() => { btn.innerHTML = "Save Changes" }, 2000);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if(newFolderName.trim()) {
        onAddFolder(newFolderName);
        setNewFolderName('');
        setIsAddingFolder(false);
    }
  }

  const handleFinishRename = () => {
      if(editingFolderId && editingFolderName.trim()) {
          onRenameFolder(editingFolderId, editingFolderName);
      }
      setEditingFolderId(null);
      setEditingFolderName('');
  }

  const toggleTag = (tag: string) => {
      if(!activePrompt) return;
      const newTags = activePrompt.tags.includes(tag) 
        ? activePrompt.tags.filter(t => t !== tag)
        : [...activePrompt.tags, tag];
      onUpdatePrompt({...activePrompt, tags: newTags});
  }

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && customTagInput.trim()) {
          toggleTag(customTagInput.trim());
          setCustomTagInput('');
      }
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar for Prompts & Folders */}
      <div className="w-64 border-r border-notion-border bg-[#191919] flex flex-col overflow-y-auto">
         <div className="p-3 border-b border-notion-border sticky top-0 bg-[#191919] z-10 flex justify-between items-center">
            <span className="text-xs font-semibold text-notion-muted">LIBRARY (Drag to move)</span>
            <button onClick={() => setIsAddingFolder(true)} title="New Folder" className="text-notion-muted hover:text-white"><FolderPlus size={14}/></button>
         </div>

         {isAddingFolder && (
             <form onSubmit={handleCreateFolder} className="p-2 border-b border-notion-border">
                 <input 
                    autoFocus
                    type="text" 
                    placeholder="Folder name..." 
                    className="w-full bg-[#2c2c2c] text-sm px-2 py-1 rounded text-white outline-none"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onBlur={() => setIsAddingFolder(false)}
                 />
             </form>
         )}
         
         {/* Folder List */}
         {folders.map(folder => (
             <div 
                key={folder.id} 
                className="mb-2 group/folder"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder.id)}
             >
                 <div className="px-3 py-1 text-xs text-notion-muted font-bold flex items-center justify-between uppercase tracking-wider hover:bg-white/5 cursor-default transition-colors rounded-sm mx-1">
                     {editingFolderId === folder.id ? (
                        <input 
                            autoFocus
                            className="bg-[#2c2c2c] text-white w-full rounded px-1 outline-none"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onBlur={handleFinishRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                        />
                     ) : (
                         <>
                            <div className="flex items-center gap-1">
                                <Folder size={10}/> {folder.name}
                            </div>
                            <div className="hidden group-hover/folder:flex items-center gap-1">
                                <button onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} className="hover:text-blue-400"><Edit2 size={10}/></button>
                                <button onClick={() => { if(confirm('Delete folder and move prompts to uncategorized?')) onDeleteFolder(folder.id); }} className="hover:text-red-400"><Trash2 size={10}/></button>
                            </div>
                         </>
                     )}
                 </div>
                 {prompts.filter(p => p.folderId === folder.id).map(p => (
                    <div 
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        onClick={() => onSelectPrompt(p.id)}
                        className={`mx-2 px-2 py-1.5 cursor-pointer rounded text-sm mb-0.5 hover:bg-notion-hover transition-colors flex items-center gap-2 group/item ${activePrompt?.id === p.id ? 'bg-notion-hover text-white' : 'text-notion-muted'}`}
                    >
                        <GripVertical size={12} className="opacity-0 group-hover/item:opacity-50 cursor-grab"/>
                        <div className="truncate">{p.title || "Untitled"}</div>
                    </div>
                 ))}
             </div>
         ))}

         {/* Uncategorized Drop Zone */}
         <div 
            className="mt-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, undefined)}
         >
             <div className="px-3 py-1 text-xs text-notion-muted font-bold flex items-center gap-1 uppercase tracking-wider hover:bg-white/5 cursor-default transition-colors rounded-sm mx-1">
                  Uncategorized
             </div>
             {prompts.filter(p => !p.folderId).map(p => (
                <div 
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onClick={() => onSelectPrompt(p.id)}
                    className={`mx-2 px-2 py-1.5 cursor-pointer rounded text-sm mb-0.5 hover:bg-notion-hover transition-colors flex items-center gap-2 group/item ${activePrompt?.id === p.id ? 'bg-notion-hover text-white' : 'text-notion-muted'}`}
                >
                    <GripVertical size={12} className="opacity-0 group-hover/item:opacity-50 cursor-grab"/>
                    <div className="truncate">{p.title || "Untitled"}</div>
                </div>
             ))}
         </div>

         <button 
            onClick={onAddPrompt}
            className="m-3 p-2 text-sm border border-notion-border rounded text-notion-muted hover:text-notion-text hover:bg-notion-hover transition-colors flex items-center justify-center gap-2"
         >
            <Plus size={16}/> New Prompt
         </button>
      </div>

      {/* Main Editor Area */}
      {activePrompt ? (
      <div className="flex-1 overflow-y-auto bg-[#191919]">
        {/* Cover Placeholder */}
        <div className="h-32 bg-gradient-to-r from-blue-900/20 to-[#191919] group relative border-b border-notion-border">
            <div className="absolute top-4 right-4 flex gap-2">
                <div className="relative">
                    <button onClick={() => setShowMoveMenu(!showMoveMenu)} className="bg-black/50 text-xs px-2 py-1 rounded text-white hover:bg-black/70 flex items-center gap-1">
                        <ArrowRight size={12}/> Move
                    </button>
                    {showMoveMenu && (
                        <div className="absolute top-8 right-0 bg-[#252525] border border-notion-border rounded shadow-xl p-1 w-48 z-20">
                            <div className="text-[10px] text-notion-muted px-2 py-1">Move to folder...</div>
                            <button 
                                onClick={() => { onMovePrompt(activePrompt.id, undefined); setShowMoveMenu(false); }}
                                className="w-full text-left px-2 py-1 text-sm hover:bg-blue-600 rounded text-notion-text"
                            >
                                Uncategorized
                            </button>
                            {folders.map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => { onMovePrompt(activePrompt.id, f.id); setShowMoveMenu(false); }}
                                    className="w-full text-left px-2 py-1 text-sm hover:bg-blue-600 rounded text-notion-text"
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => { if(confirm('Delete this prompt?')) onDeletePrompt(activePrompt.id); }}
                    className="bg-red-900/50 text-xs px-2 py-1 rounded text-red-200 hover:bg-red-900/70 flex items-center gap-1"
                >
                    <Trash2 size={12}/> Delete
                </button>
            </div>
        </div>

        <div className="max-w-4xl mx-auto px-12 py-8">
            {/* Folder Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-notion-muted mb-4">
                 <Folder size={12}/>
                 <span>{folders.find(f => f.id === activePrompt.folderId)?.name || "Uncategorized"}</span>
            </div>

            {/* Title */}
            <div className="group mb-8">
                <input
                    type="text"
                    value={activePrompt.title}
                    onChange={(e) => onUpdatePrompt({...activePrompt, title: e.target.value})}
                    className="text-4xl font-bold bg-transparent border-none outline-none text-notion-text placeholder-gray-700 w-full"
                    placeholder="Untitled Prompt"
                />
            </div>

            {/* Metrics Panel */}
            <div className="bg-[#202020] p-4 rounded-lg border border-notion-border mb-6 select-none">
                <h3 className="text-xs font-bold text-notion-muted uppercase mb-4 tracking-wider">Evaluation Metrics</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                    <MetricSlider 
                        label="Rate Exit (Success)" 
                        value={activePrompt.metrics.successRate} 
                        metricKey="successRate"
                        color="text-blue-400"
                        description="Did it solve the task?"
                        onMetricChange={handleMetricChange}
                    />
                    <MetricSlider 
                        label="Hallucination Rate" 
                        value={activePrompt.metrics.hallucination} 
                        metricKey="hallucination"
                        color="text-red-400"
                        description="Is info invented/false?"
                        onMetricChange={handleMetricChange}
                    />
                    <MetricSlider 
                        label="Response Format" 
                        value={activePrompt.metrics.formatting} 
                        metricKey="formatting"
                        color="text-green-400"
                        description="Followed structure?"
                        onMetricChange={handleMetricChange}
                    />
                    <MetricSlider 
                        label="Creativity" 
                        value={activePrompt.metrics.creativity} 
                        metricKey="creativity"
                        color="text-purple-400"
                        description="Novel ideas?"
                        onMetricChange={handleMetricChange}
                    />
                </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-sm text-notion-muted">
                    <Tag size={16} />
                    <span>Tags</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {activePrompt.tags.map(tag => (
                        <span key={tag} className="bg-[#373737] px-2 py-0.5 rounded text-sm text-notion-text flex items-center gap-1">
                            {tag}
                            <button onClick={() => toggleTag(tag)} className="hover:text-red-400">×</button>
                        </span>
                    ))}
                    <div className="relative">
                        <button 
                            onClick={() => setIsTagOpen(!isTagOpen)}
                            className="text-notion-muted text-sm cursor-pointer hover:text-notion-text px-2 py-0.5 border border-notion-border border-dashed rounded"
                        >
                            + Add Tag
                        </button>
                        {isTagOpen && (
                            <div className="absolute top-8 left-0 w-48 bg-[#252525] border border-notion-border shadow-xl rounded-md p-1 z-20 max-h-48 overflow-y-auto flex flex-col gap-1">
                                <input 
                                    autoFocus
                                    placeholder="Type & Enter..."
                                    className="bg-[#191919] text-white text-xs p-1 outline-none border-b border-notion-border mb-1"
                                    value={customTagInput}
                                    onChange={e => setCustomTagInput(e.target.value)}
                                    onKeyDown={handleAddCustomTag}
                                />
                                {TAG_OPTIONS.map(opt => (
                                    <div 
                                        key={opt}
                                        onClick={() => { toggleTag(opt); setIsTagOpen(false); }}
                                        className={`px-2 py-1 text-sm cursor-pointer hover:bg-blue-600 rounded ${activePrompt.tags.includes(opt) ? 'text-blue-400' : 'text-notion-text'}`}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-notion-border my-6"></div>

            {/* Content Editor */}
            <div className="min-h-[300px] mb-20">
                <textarea
                    value={activePrompt.content}
                    onChange={(e) => onUpdatePrompt({...activePrompt, content: e.target.value})}
                    className="w-full h-full min-h-[400px] bg-transparent resize-none outline-none text-notion-text leading-relaxed font-mono text-sm p-4 rounded-md hover:bg-[#202020] focus:bg-[#202020] transition-colors border border-transparent focus:border-notion-border"
                    placeholder="Write your prompt here..."
                />
            </div>
            
            {/* Footer Actions */}
            <div className="fixed bottom-0 right-0 w-[calc(100%-16rem)] bg-[#191919]/90 backdrop-blur border-t border-notion-border p-4 flex justify-end gap-4">
                <div className="flex items-center gap-2 text-xs text-notion-muted mr-auto px-12">
                     Last edited: {activePrompt.lastEdited}
                </div>
                <button 
                    id="save-btn"
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm flex items-center gap-2 transition-colors shadow-lg"
                >
                    <Save size={16} />
                    Save Changes
                </button>
            </div>
        </div>
      </div>
      ) : (
          <div className="flex-1 flex items-center justify-center text-notion-muted flex-col gap-4">
              <Sparkles size={48} className="opacity-20"/>
              <p>Select a prompt or create a new one</p>
          </div>
      )}
    </div>
  );
};
