
import React, { useState } from 'react';
import { Project, Bottleneck } from '../types';
import { Circle, CheckCircle2, Target, Plus, Trash2, Calendar, X, AlertTriangle, Check, List, AlignLeft } from 'lucide-react';
import { PROJECT_COLORS } from '../constants';

interface ProjectListProps {
    projects: Project[];
    activeProjectId?: string;
    onUpdateProject: (project: Project) => void;
    onAddProject: () => void;
    onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, activeProjectId, onUpdateProject, onAddProject, onDeleteProject }) => {

    const calculatePoints = (project: Project) => {
        let total = 0;
        let earned = 0;
        project.monthlies.forEach(m => {
            const mPoints = 50; total += mPoints; if(m.done) earned += mPoints;
            m.weeklies.forEach(w => {
                const wPoints = 10; total += wPoints; if(w.done) earned += wPoints;
                w.dailies.forEach(d => {
                    const dPoints = 3; total += dPoints; if(d.done) earned += dPoints;
                })
            })
        });
        return { total, earned, percent: total === 0 ? 0 : Math.round((earned / total) * 100) };
    };

    const toggleDaily = (project: Project, mId: string, wId: string, dId: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        const d = updated.monthlies.find(x => x.id === mId)?.weeklies.find(x => x.id === wId)?.dailies.find(x => x.id === dId);
        if(d) d.done = !d.done;
        onUpdateProject(updated);
    };

    const toggleWeekly = (project: Project, mId: string, wId: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        const w = updated.monthlies.find(x => x.id === mId)?.weeklies.find(x => x.id === wId);
        if(w) w.done = !w.done;
        onUpdateProject(updated);
    };

    const toggleMonthly = (project: Project, mId: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        const m = updated.monthlies.find(x => x.id === mId);
        if(m) m.done = !m.done;
        onUpdateProject(updated);
    };

    const setDeadline = (project: Project, type: 'project' | 'monthly', id: string, date: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        if (type === 'project') {
            updated.deadline = date;
        } else {
            const m = updated.monthlies.find(m => m.id === id);
            if(m) m.deadline = date;
        }
        onUpdateProject(updated);
    };

    const handleUpdateDescription = (project: Project, type: 'monthly' | 'weekly', id: string, desc: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        if (type === 'monthly') {
            const m = updated.monthlies.find(m => m.id === id);
            if(m) m.description = desc;
        } else {
            // Busqueda profunda para weekly
             updated.monthlies.forEach(m => {
                 const w = m.weeklies.find(w => w.id === id);
                 if(w) w.description = desc;
             });
        }
        onUpdateProject(updated);
    }

    // --- Bottleneck Logic ---
    const [bottleneckProjectId, setBottleneckProjectId] = useState<string | null>(null);
    const [newBottleneckText, setNewBottleneckText] = useState('');

    const addBottleneck = (project: Project) => {
        if(!newBottleneckText.trim()) return;
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        if(!updated.bottlenecks) updated.bottlenecks = [];
        updated.bottlenecks.push({
            id: Date.now().toString(),
            description: newBottleneckText,
            resolved: false
        });
        onUpdateProject(updated);
        setNewBottleneckText('');
    };

    const toggleBottleneck = (project: Project, bId: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        const b = updated.bottlenecks?.find(x => x.id === bId);
        if(b) b.resolved = !b.resolved;
        onUpdateProject(updated);
    }

    const deleteBottleneck = (project: Project, bId: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        updated.bottlenecks = updated.bottlenecks?.filter(x => x.id !== bId) || [];
        onUpdateProject(updated);
    }
    // ------------------------

    const AddItemForm = ({ placeholderTitle, placeholderDesc, onAdd, onCancel }: any) => {
        const [title, setTitle] = useState('');
        const [desc, setDesc] = useState('');
        return (
            <div className="bg-[#2a2a2a] p-3 rounded border border-notion-border animate-fade-in mt-2">
                <input autoFocus className="w-full bg-transparent text-notion-text outline-none text-sm font-medium mb-2" placeholder={placeholderTitle} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && title) onAdd(title, desc); }} />
                {placeholderDesc && <input className="w-full bg-transparent text-notion-muted outline-none text-xs mb-3" placeholder={placeholderDesc} value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && title) onAdd(title, desc); }} />}
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-2 py-1 text-xs text-notion-muted">Cancel</button>
                    <button onClick={() => { if(title) onAdd(title, desc); }} className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Add</button>
                </div>
            </div>
        );
    };

    const [addingKey, setAddingKey] = useState<string | null>(null);
    const [colorPickerProjectId, setColorPickerProjectId] = useState<string | null>(null);

    const handleAddGoal = (project: Project, type: 'monthly' | 'weekly' | 'daily', parentId: string, title: string, desc: string) => {
        const updated = JSON.parse(JSON.stringify(project)) as Project;
        const newId = Date.now().toString();
        if (type === 'monthly') updated.monthlies.push({ id: newId, title, description: desc, done: false, weeklies: [] });
        else if (type === 'weekly') {
            const m = updated.monthlies.find(m => m.id === parentId);
            if (m) m.weeklies.push({ id: newId, title, description: desc, done: false, dailies: [] });
        } else if (type === 'daily') {
             const [mId, wId] = parentId.split('-');
             const w = updated.monthlies.find(m => m.id === mId)?.weeklies.find(w => w.id === wId);
             if (w) w.dailies.push({ id: newId, title, done: false });
        }
        onUpdateProject(updated);
        setAddingKey(null);
    };

    const filteredProjects = activeProjectId ? projects.filter(p => p.id === activeProjectId) : projects;
    const activeBottleneckProject = projects.find(p => p.id === bottleneckProjectId);

    return (
        <div className="p-8 max-w-5xl mx-auto pb-20 relative">
             <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-notion-text">Projects & Objectives</h1>
                <button onClick={onAddProject} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded shadow flex items-center gap-2">
                    <Plus size={16}/> New Project
                </button>
             </div>

             {/* MODAL: BOTTLENECKS (PRIORIDAD ALTA) */}
             {activeBottleneckProject && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setBottleneckProjectId(null)}>
                     <div 
                        className="bg-[#1e1e1e] rounded-2xl border border-notion-border shadow-2xl flex flex-col overflow-hidden animate-slide-up relative"
                        style={{ width: '85vw', height: '80vh', borderColor: activeBottleneckProject.color }}
                        onClick={e => e.stopPropagation()}
                     >
                         <div className="p-6 border-b border-notion-border bg-[#252525] flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <AlertTriangle className="text-yellow-500" size={24}/>
                                 <div>
                                     <h2 className="text-2xl font-bold text-white tracking-tight">Critical Bottlenecks</h2>
                                     <p className="text-sm text-notion-muted">Resolve these to unblock project: <span style={{color: activeBottleneckProject.color}}>{activeBottleneckProject.title}</span></p>
                                 </div>
                             </div>
                             <button onClick={() => setBottleneckProjectId(null)} className="p-2 hover:bg-white/10 rounded-full text-notion-muted hover:text-white transition-colors">
                                 <X size={28}/>
                             </button>
                         </div>
                         
                         <div className="flex-1 p-8 overflow-y-auto bg-[#191919]">
                             <div className="max-w-3xl mx-auto space-y-6">
                                 {/* Input Area */}
                                 <div className="flex gap-4 mb-8">
                                     <input 
                                        autoFocus
                                        className="flex-1 bg-[#252525] border border-notion-border rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Identify a new bottleneck..."
                                        value={newBottleneckText}
                                        onChange={e => setNewBottleneckText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addBottleneck(activeBottleneckProject)}
                                     />
                                     <button 
                                        onClick={() => addBottleneck(activeBottleneckProject)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold flex items-center gap-2"
                                     >
                                         <Plus size={20}/> ADD
                                     </button>
                                 </div>

                                 {/* List */}
                                 <div className="space-y-4">
                                     {(activeBottleneckProject.bottlenecks || []).map((b, idx) => (
                                         <div key={b.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${b.resolved ? 'bg-[#1e1e1e] border-transparent opacity-50' : 'bg-[#252525] border-notion-border hover:border-yellow-500/50'}`}>
                                             <div className="font-mono text-notion-muted text-xl font-bold opacity-30">#{idx + 1}</div>
                                             <div className="flex-1">
                                                 <p className={`text-lg ${b.resolved ? 'line-through text-notion-muted' : 'text-white'}`}>{b.description}</p>
                                             </div>
                                             <button 
                                                onClick={() => toggleBottleneck(activeBottleneckProject, b.id)}
                                                className={`p-2 rounded-full border ${b.resolved ? 'border-green-500 text-green-500' : 'border-notion-border text-notion-muted hover:text-white hover:border-white'}`}
                                             >
                                                 <Check size={20}/>
                                             </button>
                                             <button 
                                                onClick={() => deleteBottleneck(activeBottleneckProject, b.id)}
                                                className="p-2 text-notion-muted hover:text-red-500"
                                             >
                                                 <Trash2 size={20}/>
                                             </button>
                                         </div>
                                     ))}
                                     {(!activeBottleneckProject.bottlenecks || activeBottleneckProject.bottlenecks.length === 0) && (
                                         <div className="text-center py-20 text-notion-muted opacity-30 flex flex-col items-center gap-4">
                                             <List size={64}/>
                                             <p className="text-xl">No bottlenecks identified. Great job!</p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             {/* MEGA PALETA DE COLORES - MODAL */}
             {colorPickerProjectId && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setColorPickerProjectId(null)}>
                     <div 
                        className="bg-[#1e1e1e] rounded-2xl border border-notion-border shadow-2xl flex flex-col overflow-hidden animate-slide-up"
                        style={{ width: '75vw', height: '30vh' }}
                        onClick={e => e.stopPropagation()}
                     >
                         <div className="p-4 border-b border-notion-border flex justify-between items-center bg-[#252525]">
                             <div className="flex items-center gap-2">
                                <Target size={18} className="text-blue-400"/>
                                <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Selecciona el Tono del Proyecto</h3>
                             </div>
                             <button onClick={() => setColorPickerProjectId(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                 <X size={20} className="text-notion-muted" />
                             </button>
                         </div>
                         <div className="flex-1 p-8 overflow-y-auto">
                             <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-6 place-items-center">
                                 {PROJECT_COLORS.map(c => (
                                     <button 
                                         key={c} 
                                         className="w-12 h-12 rounded-xl cursor-pointer hover:scale-125 hover:rotate-6 transition-all duration-300 shadow-lg ring-offset-2 ring-offset-[#1e1e1e] hover:ring-2 hover:ring-white" 
                                         style={{ background: c }}
                                         onClick={() => {
                                             const project = projects.find(p => p.id === colorPickerProjectId);
                                             if(project) onUpdateProject({...project, color: c});
                                             setColorPickerProjectId(null);
                                         }}
                                     />
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             <div className="space-y-12">
                 {filteredProjects.map(project => {
                     const stats = calculatePoints(project);
                     const bottleneckCount = project.bottlenecks?.filter(b => !b.resolved).length || 0;
                     return (
                     <div key={project.id} className="animate-fade-in mb-16 relative">
                         <button onClick={() => { if(confirm("Delete this project?")) onDeleteProject(project.id); }} className="absolute -right-12 top-0 text-notion-muted hover:text-red-500 p-2"><Trash2 size={16}/></button>
                        <div className="mb-6 border-b border-notion-border pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 w-full">
                                    <Target className="cursor-pointer hover:scale-110 transition-transform shadow-xl rounded-full" style={{ color: project.color }} size={24} onClick={() => setColorPickerProjectId(project.id)} />
                                    <input className="text-2xl font-bold bg-transparent text-notion-text outline-none w-full border-b border-transparent focus:border-notion-border transition-colors" defaultValue={project.title} onBlur={(e) => onUpdateProject({...project, title: e.target.value})} />
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <span className="text-3xl font-mono" style={{color: project.color}}>{stats.earned}</span>
                                    <span className="text-sm text-notion-muted"> / {stats.total} pts</span>
                                </div>
                            </div>
                            <input className="text-notion-muted bg-transparent w-full outline-none text-sm mb-3 border-b border-transparent focus:border-notion-border transition-colors" defaultValue={project.description} onBlur={(e) => onUpdateProject({...project, description: e.target.value})} placeholder="Add a description..." />
                            <div className="h-2 w-full bg-[#2c2c2c] rounded-full overflow-hidden mb-2">
                                <div className="h-full transition-all duration-500" style={{ width: `${stats.percent}%`, backgroundColor: project.color }}></div>
                            </div>
                            <div className="flex justify-end items-center gap-3">
                                {/* Boton de Cuellos de Botella */}
                                <button 
                                    onClick={() => setBottleneckProjectId(project.id)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded border text-xs font-bold uppercase transition-all ${bottleneckCount > 0 ? 'bg-red-900/30 border-red-500 text-red-400 animate-pulse' : 'bg-[#2a2a2a] border-notion-border text-notion-muted hover:text-white'}`}
                                >
                                    <AlertTriangle size={12}/>
                                    {bottleneckCount > 0 ? `${bottleneckCount} Bottlenecks` : 'No Bottlenecks'}
                                </button>
                                
                                <span className="text-xs text-notion-muted flex items-center gap-1"><Calendar size={12}/> Deadline:</span>
                                <input type="date" className="bg-[#2a2a2a] text-[10px] text-notion-text border border-notion-border rounded px-2 py-0.5 outline-none hover:border-notion-muted transition-colors" value={project.deadline || ''} onChange={(e) => setDeadline(project, 'project', project.id, e.target.value)} />
                            </div>
                        </div>

                        <div className="pl-2">
                            {project.monthlies.map(monthly => (
                                <div key={monthly.id} className="relative pl-6 pb-6 border-l-2 border-[#373737] last:border-0 group/month">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#191919] border-2 z-10" style={{borderColor: project.color}}></div>
                                    <div className="mb-4 bg-[#202020] p-4 rounded border border-notion-border hover:border-notion-muted/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold uppercase tracking-wider" style={{color: project.color}}>Monthly (50pts)</span>
                                                    <div className="flex items-center gap-1 bg-[#2c2c2c] px-2 rounded border border-notion-border">
                                                        <Calendar size={10} className="text-notion-muted"/>
                                                        <input type="date" className="bg-transparent text-[10px] text-notion-text border-none outline-none w-20 py-0.5" value={monthly.deadline || ''} onChange={(e) => setDeadline(project, 'monthly', monthly.id, e.target.value)} />
                                                    </div>
                                                </div>
                                                <input className={`font-bold text-lg text-notion-text bg-transparent w-full outline-none ${monthly.done ? 'line-through opacity-50' : ''}`} defaultValue={monthly.title} />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <AlignLeft size={14} className="text-notion-muted"/>
                                                    <input 
                                                        className="text-sm text-notion-muted bg-transparent w-full outline-none border-b border-transparent focus:border-notion-border placeholder:opacity-50" 
                                                        defaultValue={monthly.description || ''} 
                                                        placeholder="Add monthly goal description / bottlenecks..." 
                                                        onBlur={(e) => handleUpdateDescription(project, 'monthly', monthly.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => toggleMonthly(project, monthly.id)} className="text-notion-muted hover:text-green-400">
                                                {monthly.done ? <CheckCircle2 className="text-green-500" size={24}/> : <Circle size={24}/>}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pl-4 space-y-4">
                                        {monthly.weeklies.map(weekly => (
                                            <div key={weekly.id} className="relative pl-6 border-l border-[#373737] last:border-0">
                                                 <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#373737]"></div>
                                                 <div className="bg-[#252525] p-3 rounded border border-notion-border/50 hover:bg-[#2a2a2a] transition-colors mb-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex-1">
                                                            <span className="text-[10px] font-bold uppercase" style={{color: project.color}}>Weekly (10pts)</span>
                                                            <input className={`font-medium text-notion-text bg-transparent w-full outline-none ${weekly.done ? 'line-through opacity-50' : ''}`} defaultValue={weekly.title} />
                                                            <input 
                                                                className="text-xs text-notion-muted bg-transparent w-full outline-none mt-1 border-b border-transparent focus:border-notion-border placeholder:opacity-50" 
                                                                defaultValue={weekly.description || ''} 
                                                                placeholder="Week description..." 
                                                                onBlur={(e) => handleUpdateDescription(project, 'weekly', weekly.id, e.target.value)}
                                                            />
                                                        </div>
                                                        <button onClick={() => toggleWeekly(project, monthly.id, weekly.id)} className="text-notion-muted hover:text-green-400">
                                                            {weekly.done ? <CheckCircle2 className="text-green-500" size={20}/> : <Circle size={20}/>}
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-notion-border/30 space-y-1">
                                                        {weekly.dailies.map(daily => (
                                                            <div key={daily.id} className="flex items-center justify-between group/daily pl-2 py-1 hover:bg-[#303030] rounded cursor-pointer" onClick={() => toggleDaily(project, monthly.id, weekly.id, daily.id)}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${daily.done ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                                                    <span className={`text-sm ${daily.done ? 'text-notion-muted line-through' : 'text-gray-300'}`}>{daily.title}</span>
                                                                </div>
                                                                {daily.done && <CheckCircle2 size={14} className="text-green-500 mr-2"/>}
                                                            </div>
                                                        ))}
                                                        {addingKey === `${project.id}-${monthly.id}-${weekly.id}` ? (
                                                            <AddItemForm placeholderTitle="Daily MVP Title..." onAdd={(t:any) => handleAddGoal(project, 'daily', `${monthly.id}-${weekly.id}`, t, '')} onCancel={() => setAddingKey(null)} />
                                                        ) : (
                                                            <div onClick={() => setAddingKey(`${project.id}-${monthly.id}-${weekly.id}`)} className="pl-2 py-1 text-xs text-notion-muted hover:text-white cursor-pointer opacity-50 flex items-center gap-1 mt-2">
                                                                <Plus size={12}/> Add MVP (Daily)
                                                            </div>
                                                        )}
                                                    </div>
                                                 </div>
                                            </div>
                                        ))}
                                        {addingKey === `${project.id}-${monthly.id}` ? (
                                            <div className="pl-6 border-l border-[#373737]">
                                                <AddItemForm placeholderTitle="Weekly Goal Title..." onAdd={(t:any, d:any) => handleAddGoal(project, 'weekly', monthly.id, t, d)} onCancel={() => setAddingKey(null)} />
                                            </div>
                                        ) : (
                                            <div onClick={() => setAddingKey(`${project.id}-${monthly.id}`)} className="ml-6 py-2 text-xs opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1" style={{color: project.color}}>
                                                <Plus size={12}/> Add Weekly Goal
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {addingKey === project.id ? (
                                <div className="pl-6 border-l-2 border-[#373737]">
                                    <AddItemForm placeholderTitle="Monthly Goal Title..." onAdd={(t:any, d:any) => handleAddGoal(project, 'monthly', project.id, t, d)} onCancel={() => setAddingKey(null)} />
                                </div>
                            ) : (
                                <div onClick={() => setAddingKey(project.id)} className="pl-6 py-2 text-sm opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1 font-medium" style={{color: project.color}}>
                                    <Plus size={14}/> Add Monthly Goal
                                </div>
                            )}
                        </div>
                     </div>
                 )})}
             </div>
        </div>
    );
};
