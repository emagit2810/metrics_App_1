
import React, { useState } from 'react';
import { Habit, HabitStatus, HabitFrequency } from '../types';
import { CheckSquare, Plus, ChevronDown, ChevronUp, Calendar, Hash, MessageSquare } from 'lucide-react';

interface HabitsViewProps {
    habits: Habit[];
    onUpdateHabit: (habit: Habit) => void;
    onAddHabit: (name: string, frequency: HabitFrequency) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ habits, onUpdateHabit, onAddHabit }) => {
    const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
    const [newHabitName, setNewHabitName] = useState('');
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    
    // New Habit Form State
    const [freqType, setFreqType] = useState<HabitFrequency['type']>('daily');
    const [freqValue, setFreqValue] = useState<number>(1);

    const getDaysArray = (start: string, end: string) => {
        const arr = [];
        const dt = new Date(start);
        const endDate = new Date(end);
        while (dt <= endDate) {
            arr.push(new Date(dt).toISOString().split('T')[0]);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    };

    const toggleHistoryStatus = (habit: Habit, dateKey: string) => {
        const current = habit.history[dateKey] || 'pending';
        let next: HabitStatus = 'completed';
        if (current === 'completed') next = 'failed';
        else if (current === 'failed') next = 'pending';
        
        // Recalculate streak simple version (consecutive from today backwards)
        // Note: Real streak logic is complex with gaps, simplified here for interaction
        const updatedHistory = { ...habit.history, [dateKey]: next };
        
        onUpdateHabit({ ...habit, history: updatedHistory });
    };

    const handleCreate = () => {
        if(newHabitName.trim()) {
            onAddHabit(newHabitName, { type: freqType, value: freqValue });
            setNewHabitName('');
            setIsAddingHabit(false);
        }
    };

    const updateFrequency = (habit: Habit, type: HabitFrequency['type'], value: number) => {
        onUpdateHabit({ ...habit, frequency: { type, value } });
    }

    return (
        <div className="p-8 max-w-4xl mx-auto pb-32">
             <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-notion-text">Habit Tracker</h1>
                <button onClick={() => setIsAddingHabit(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm shadow-lg hover:shadow-blue-900/20 transition-all">
                    <Plus size={16}/> New Habit
                </button>
             </div>

             {isAddingHabit && (
                 <div className="mb-8 p-6 bg-[#202020] rounded-xl border border-notion-border animate-fade-in shadow-2xl">
                     <h3 className="text-sm font-bold text-notion-muted uppercase mb-4">Create New Habit</h3>
                     <input 
                        autoFocus
                        placeholder="Habit Name (e.g., Read 30 mins)"
                        className="w-full bg-[#191919] border border-notion-border rounded p-2 text-notion-text outline-none focus:border-blue-500 mb-4"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                     />
                     
                     <div className="flex items-center gap-4 mb-6">
                         <label className="text-sm text-notion-muted">Frequency:</label>
                         <select 
                            className="bg-[#191919] text-notion-text border border-notion-border rounded px-2 py-1 text-sm outline-none"
                            value={freqType}
                            onChange={(e) => setFreqType(e.target.value as any)}
                         >
                             <option value="daily">Daily</option>
                             <option value="interval">Every X Days</option>
                             <option value="weekly">Weekly</option>
                         </select>

                         {freqType !== 'daily' && (
                             <div className="flex items-center gap-2">
                                <span className="text-sm text-notion-muted">{freqType === 'interval' ? 'Every' : 'Times per week:'}</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="30" 
                                    className="w-12 bg-[#191919] border border-notion-border rounded px-2 py-1 text-sm text-center outline-none"
                                    value={freqValue}
                                    onChange={e => setFreqValue(parseInt(e.target.value))}
                                />
                                {freqType === 'interval' && <span className="text-sm text-notion-muted">days</span>}
                             </div>
                         )}
                     </div>

                     <div className="flex justify-end gap-3">
                         <button onClick={() => setIsAddingHabit(false)} className="px-4 py-2 rounded text-notion-muted hover:bg-[#2c2c2c] text-sm">Cancel</button>
                         <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-500">Create Habit</button>
                     </div>
                 </div>
             )}

             <div className="space-y-4">
                 {habits.map(habit => {
                     const isExpanded = expandedHabitId === habit.id;
                     const todayKey = new Date().toISOString().split('T')[0];
                     const todayStatus = habit.history[todayKey] || 'pending';
                     
                     // Generate last 7 days for mini-view
                     const miniHistoryKeys = getDaysArray(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString());

                     return (
                         <div key={habit.id} className={`bg-notion-sidebar border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-500/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.3)]' : 'border-notion-border rounded-lg hover:border-notion-muted'}`}>
                             {/* Header Card */}
                             <div 
                                className="p-4 flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                             >
                                 <div className="flex items-center gap-4">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); toggleHistoryStatus(habit, todayKey); }}
                                        className={`p-2 rounded-lg transition-all active:scale-95 ${
                                            todayStatus === 'completed' ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 
                                            todayStatus === 'failed' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' :
                                            'bg-[#2c2c2c] text-notion-muted hover:bg-[#373737]'
                                        }`}
                                     >
                                        <CheckSquare size={20} />
                                     </button>
                                     <div>
                                         <h3 className={`font-bold text-lg ${todayStatus === 'completed' ? 'text-notion-text opacity-50 decoration-slate-500' : 'text-notion-text'}`}>{habit.title}</h3>
                                         <div className="flex items-center gap-2 text-xs text-notion-muted">
                                            <span className="text-blue-400 font-mono font-bold">{habit.streak} day streak</span>
                                            <span>•</span>
                                            <span className="capitalize">{habit.frequency.type === 'daily' ? 'Daily' : habit.frequency.type === 'interval' ? `Every ${habit.frequency.value} days` : `${habit.frequency.value}x Weekly`}</span>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-4">
                                     {/* Mini Heatmap */}
                                     <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        {miniHistoryKeys.map((date, i) => {
                                            const st = habit.history[date] || 'pending';
                                            return (
                                                <div 
                                                    key={date}
                                                    onClick={() => toggleHistoryStatus(habit, date)} 
                                                    title={date}
                                                    className={`w-3 h-3 rounded-sm cursor-pointer transition-colors hover:ring-1 ring-white ${
                                                        st === 'completed' ? 'bg-green-500' : 
                                                        st === 'failed' ? 'bg-red-500' :
                                                        'bg-[#2c2c2c]'
                                                    }`} 
                                                />
                                            );
                                        })}
                                     </div>
                                     {isExpanded ? <ChevronUp size={20} className="text-notion-muted"/> : <ChevronDown size={20} className="text-notion-muted"/>}
                                 </div>
                             </div>

                             {/* Expanded Details */}
                             {isExpanded && (
                                 <div className="bg-[#1a1a1a] border-t border-notion-border p-6 animate-slide-down">
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                         
                                         {/* 1. Configuration */}
                                         <div className="space-y-4">
                                             <h4 className="text-xs font-bold text-notion-muted uppercase tracking-wider flex items-center gap-2">
                                                 <Hash size={12}/> Configuration
                                             </h4>
                                             <div className="bg-[#252525] p-3 rounded-lg border border-notion-border">
                                                 <label className="text-xs text-notion-muted block mb-1">Frequency Type</label>
                                                 <select 
                                                    className="w-full bg-transparent text-sm text-notion-text outline-none mb-3 border-b border-notion-border pb-1"
                                                    value={habit.frequency.type}
                                                    onChange={(e) => updateFrequency(habit, e.target.value as any, habit.frequency.value)}
                                                 >
                                                     <option value="daily">Daily</option>
                                                     <option value="interval">Every X Days</option>
                                                     <option value="weekly">Times per Week</option>
                                                 </select>
                                                 
                                                 {habit.frequency.type !== 'daily' && (
                                                     <>
                                                        <label className="text-xs text-notion-muted block mb-1">Value</label>
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-transparent text-sm text-notion-text outline-none border-b border-notion-border pb-1"
                                                            value={habit.frequency.value}
                                                            onChange={(e) => updateFrequency(habit, habit.frequency.type, parseInt(e.target.value))}
                                                        />
                                                     </>
                                                 )}
                                             </div>
                                             
                                             <div className="bg-[#252525] p-3 rounded-lg border border-notion-border">
                                                 <label className="text-xs text-notion-muted block mb-1 flex items-center gap-1"><MessageSquare size={10}/> Comment / Motivation</label>
                                                 <textarea 
                                                    className="w-full bg-transparent text-sm text-notion-text outline-none resize-none h-20 placeholder-notion-muted/50"
                                                    placeholder="Why do you want to keep this habit?"
                                                    value={habit.comments || ''}
                                                    onChange={(e) => onUpdateHabit({...habit, comments: e.target.value})}
                                                 />
                                             </div>
                                         </div>

                                         {/* 2. Full Timeline */}
                                         <div className="md:col-span-2">
                                              <h4 className="text-xs font-bold text-notion-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                                 <Calendar size={12}/> Complete Timeline
                                              </h4>
                                              <div className="bg-[#252525] p-4 rounded-lg border border-notion-border max-h-[300px] overflow-y-auto custom-scrollbar">
                                                  <div className="flex flex-wrap gap-1.5 content-start">
                                                      {getDaysArray(habit.startDate, new Date().toISOString().split('T')[0]).reverse().map(date => {
                                                          const st = habit.history[date] || 'pending';
                                                          return (
                                                              <div 
                                                                key={date}
                                                                onClick={() => toggleHistoryStatus(habit, date)}
                                                                title={`${date}: ${st}`}
                                                                className={`w-8 h-8 rounded text-[10px] flex items-center justify-center cursor-pointer border hover:scale-110 transition-transform ${
                                                                    st === 'completed' ? 'bg-green-600/20 border-green-600 text-green-500' :
                                                                    st === 'failed' ? 'bg-red-600/20 border-red-600 text-red-500' :
                                                                    'bg-[#191919] border-notion-border text-notion-muted'
                                                                }`}
                                                              >
                                                                  <div className="flex flex-col items-center leading-none pointer-events-none">
                                                                      <span className="font-bold">{date.split('-')[2]}</span>
                                                                      <span className="text-[8px] opacity-50">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(date).getDay()]}</span>
                                                                  </div>
                                                              </div>
                                                          )
                                                      })}
                                                  </div>
                                              </div>
                                              <div className="mt-2 text-[10px] text-notion-muted flex gap-4 justify-end">
                                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Completed</span>
                                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Failed</span>
                                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#373737]"></div>Pending</span>
                                              </div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                     )
                 })}
             </div>
        </div>
    );
};
