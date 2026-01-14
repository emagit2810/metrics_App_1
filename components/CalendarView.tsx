
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink, Target, Calendar as CalendarIcon } from 'lucide-react';
import { Project } from '../types';

interface CalendarViewProps {
    projects: Project[];
    onSelectProject: (projectId: string) => void;
}

type SelectedEvent = {
    type: 'project' | 'milestone';
    projectId: string;
    projectTitle: string;
    projectColor: string;
    title: string;
    description: string;
    deadline: string;
    progress: number;
} | null;

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, onSelectProject }) => {
    const [selectedEvent, setSelectedEvent] = useState<SelectedEvent>(null);
    const [viewDate, setViewDate] = useState(new Date());

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    // Generación de cuadrícula fija de 42 celdas (6 semanas x 7 días)
    const { calendarDays } = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const days = [];
        // Días del mes anterior (opcionalmente vacíos)
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // Días del mes actual
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        // Rellenar hasta 42 para mantener la cuadrícula simétrica 6x7
        while (days.length < 42) {
            days.push(null);
        }

        return { calendarDays: days };
    }, [currentMonth, currentYear]);

    const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
    const handleGoToToday = () => setViewDate(new Date());

    const isSameDate = (dateStr: string | undefined, day: number | null) => {
        if (!dateStr || day === null) return false;
        const [y, m, d] = dateStr.split('-').map(Number);
        return y === currentYear && m === (currentMonth + 1) && d === day;
    };

    const getProjectProgress = (p: Project) => {
         let total = 0;
         let earned = 0;
         p.monthlies.forEach(m => {
            total += 50; if(m.done) earned += 50;
            m.weeklies.forEach(w => {
                total += 10; if(w.done) earned += 10;
                w.dailies.forEach(d => {
                    total += 3; if(d.done) earned += 3;
                })
            })
         });
         return total === 0 ? 0 : Math.round((earned / total) * 100);
    }

    const today = new Date();
    const isTodayCell = (day: number | null) => {
        return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col relative select-none">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h1 className="text-4xl font-black text-notion-text flex items-center gap-4">
                        {monthNames[currentMonth]} 
                        <span className="text-notion-muted font-light">{currentYear}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-notion-hover rounded-md text-notion-muted hover:text-white transition-all active:scale-90"
                    >
                        <ChevronLeft size={24}/>
                    </button>
                    <button 
                        onClick={handleGoToToday}
                        className="px-5 py-2 bg-[#2a2a2a] hover:bg-[#353535] rounded-lg text-sm font-bold text-notion-text transition-all border border-notion-border shadow-sm active:scale-95"
                    >
                        Today
                    </button>
                    <button 
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-notion-hover rounded-md text-notion-muted hover:text-white transition-all active:scale-90"
                    >
                        <ChevronRight size={24}/>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#0f1115] rounded-xl border border-notion-border flex flex-col overflow-hidden shadow-2xl">
                {/* Headers */}
                <div className="grid grid-cols-7 border-b border-notion-border bg-[#15171b] shrink-0">
                    {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
                        <div key={d} className="py-3 text-center text-[10px] font-black text-notion-muted tracking-[0.2em]">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid con 6 filas exactas para visibilidad total */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 h-full overflow-hidden">
                    {calendarDays.map((date, index) => {
                        const projectDeadlines = projects.filter(p => isSameDate(p.deadline, date));
                        const monthlyDeadlines = projects.flatMap(p => 
                            p.monthlies.filter(m => isSameDate(m.deadline, date)).map(m => ({
                                ...m, 
                                projectColor: p.color, 
                                projectName: p.title,
                                projectId: p.id,
                                totalProgress: getProjectProgress(p)
                            }))
                        );

                        const isToday = isTodayCell(date);
                        const isWeekend = index % 7 === 0 || index % 7 === 6;

                        return (
                            <div 
                                key={index} 
                                className={`border-r border-b border-notion-border/20 p-2 relative group flex flex-col transition-all duration-200 ${date === null ? 'bg-[#0a0c0f]' : 'hover:bg-[#1a1d23]'} ${isWeekend && date !== null ? 'bg-white/[0.02]' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1 shrink-0">
                                    {date !== null && (
                                        <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-md transition-all ${isToday ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] scale-110' : 'text-notion-muted group-hover:text-notion-text'}`}>
                                            {date}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                    {/* Eventos de Proyecto */}
                                    {projectDeadlines.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => setSelectedEvent({
                                                type: 'project',
                                                projectId: p.id,
                                                projectTitle: p.title,
                                                projectColor: p.color,
                                                title: 'FINAL: ' + p.title,
                                                description: p.description,
                                                deadline: p.deadline || '',
                                                progress: getProjectProgress(p)
                                            })}
                                            className="text-[9px] font-black bg-black/40 px-1.5 py-1 rounded-md border-l-2 shadow-sm cursor-pointer hover:brightness-125 truncate transition-all" 
                                            style={{borderColor: p.color, color: p.color}}
                                        >
                                            {p.title}
                                        </div>
                                    ))}

                                    {/* Eventos de Mes */}
                                    {monthlyDeadlines.map(m => (
                                        <div 
                                            key={m.id} 
                                            onClick={() => setSelectedEvent({
                                                type: 'milestone',
                                                projectId: m.projectId,
                                                projectTitle: m.projectName,
                                                projectColor: m.projectColor,
                                                title: 'MONTHLY: ' + m.title,
                                                description: m.description,
                                                deadline: m.deadline || '',
                                                progress: m.totalProgress
                                            })}
                                            className="text-[9px] bg-[#1e1e1e] px-1.5 py-1 rounded border border-notion-border flex items-center gap-1.5 cursor-pointer hover:bg-notion-hover transition-all"
                                        >
                                             <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{backgroundColor: m.projectColor}}></div>
                                             <span className={`truncate text-notion-text ${m.done ? 'line-through opacity-40' : ''}`}>{m.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Modal de Detalle */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEvent(null)}>
                    <div 
                        className="bg-[#191919] w-full max-w-md rounded-2xl border border-notion-border shadow-2xl overflow-hidden animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="h-2 w-full" style={{ backgroundColor: selectedEvent.projectColor }}></div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target size={14} style={{ color: selectedEvent.projectColor }} />
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50">
                                            {selectedEvent.projectTitle}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-notion-hover rounded-full text-notion-muted transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="flex items-center gap-3 text-sm text-notion-muted bg-white/5 p-3 rounded-lg border border-white/5">
                                    <CalendarIcon size={16} className="text-blue-400" />
                                    <span>Vencimiento: <strong className="text-white">{selectedEvent.deadline}</strong></span>
                                </div>
                                
                                {selectedEvent.description && (
                                    <div className="text-sm text-notion-muted bg-[#202020] p-4 rounded-lg border border-notion-border italic border-l-4" style={{borderLeftColor: selectedEvent.projectColor}}>
                                        {selectedEvent.description}
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-notion-muted uppercase tracking-widest">Estado General</span>
                                        <span className="text-xs font-mono font-bold" style={{ color: selectedEvent.projectColor }}>{selectedEvent.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-notion-border rounded-full overflow-hidden">
                                        <div className="h-full transition-all duration-1000" style={{ width: `${selectedEvent.progress}%`, backgroundColor: selectedEvent.projectColor }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        onSelectProject(selectedEvent.projectId);
                                        setSelectedEvent(null);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all text-xs"
                                >
                                    <ExternalLink size={16} />
                                    ABRIR PROYECTO
                                </button>
                                <button 
                                    onClick={() => setSelectedEvent(null)}
                                    className="px-4 py-3 bg-notion-hover text-notion-text font-bold rounded-xl text-xs border border-notion-border"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #373737; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a4a4a; }
            `}</style>
        </div>
    )
}
