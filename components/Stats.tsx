import React from 'react';
import { PromptEntry, Habit } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Info } from 'lucide-react';

interface StatsProps {
    prompts: PromptEntry[];
    habits: Habit[];
}

export const Stats: React.FC<StatsProps> = ({ prompts, habits }) => {
    
    // Calculate Averages based on new metrics
    const avgSuccess = prompts.reduce((acc, p) => acc + p.metrics.successRate, 0) / (prompts.length || 1);
    const avgHallucination = prompts.reduce((acc, p) => acc + p.metrics.hallucination, 0) / (prompts.length || 1);
    const avgFormat = prompts.reduce((acc, p) => acc + p.metrics.formatting, 0) / (prompts.length || 1);
    const avgCreativity = prompts.reduce((acc, p) => acc + p.metrics.creativity, 0) / (prompts.length || 1);

    const radarData = [
        { subject: 'Success Rate', A: avgSuccess, fullMark: 10 },
        { subject: 'Hallucination', A: avgHallucination, fullMark: 10 },
        { subject: 'Formatting', A: avgFormat, fullMark: 10 },
        { subject: 'Creativity', A: avgCreativity, fullMark: 10 },
    ];

    const habitData = habits.map(h => ({
        name: h.title,
        streak: h.streak
    }));

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-notion-text mb-6">Dashboard</h1>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-notion-sidebar border border-notion-border p-4 rounded-lg shadow-sm">
                    <h3 className="text-notion-muted text-xs font-medium uppercase tracking-wider mb-1">Total Prompts</h3>
                    <p className="text-2xl font-bold text-white">{prompts.length}</p>
                </div>
                <div className="bg-notion-sidebar border border-notion-border p-4 rounded-lg shadow-sm">
                    <h3 className="text-notion-muted text-xs font-medium uppercase tracking-wider mb-1">Success Avg</h3>
                    <p className="text-2xl font-bold text-blue-400">{avgSuccess.toFixed(1)}/10</p>
                </div>
                <div className="bg-notion-sidebar border border-notion-border p-4 rounded-lg shadow-sm">
                    <h3 className="text-notion-muted text-xs font-medium uppercase tracking-wider mb-1">Hallucination Avg</h3>
                    <p className="text-2xl font-bold text-red-400">{avgHallucination.toFixed(1)}/10</p>
                </div>
                <div className="bg-notion-sidebar border border-notion-border p-4 rounded-lg shadow-sm">
                    <h3 className="text-notion-muted text-xs font-medium uppercase tracking-wider mb-1">Creativity Avg</h3>
                    <p className="text-2xl font-bold text-purple-400">{avgCreativity.toFixed(1)}/10</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Radar Chart for Prompt Metrics */}
                <div className="bg-notion-sidebar border border-notion-border p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4 text-notion-text border-b border-notion-border pb-2">Prompt Performance</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#373737" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9b9b9b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar
                                    name="Average"
                                    dataKey="A"
                                    stroke="#2383e2"
                                    fill="#2383e2"
                                    fillOpacity={0.3}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#191919', borderColor: '#373737', color: '#d4d4d4' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Habit Streaks Bar Chart */}
                <div className="bg-notion-sidebar border border-notion-border p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4 text-notion-text border-b border-notion-border pb-2">Habit Streaks</h2>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={habitData}>
                                <XAxis dataKey="name" stroke="#9b9b9b" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#9b9b9b" fontSize={12} tickLine={false} axisLine={false}/>
                                <Tooltip cursor={{fill: '#2c2c2c'}} contentStyle={{ backgroundColor: '#191919', borderColor: '#373737', color: '#d4d4d4' }} />
                                <Bar dataKey="streak" fill="#4ade80" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Metric Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#202020] border border-notion-border/50">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Info size={16} />
                        <span className="font-semibold text-sm">Rate Exit (Success)</span>
                    </div>
                    <p className="text-xs text-notion-muted leading-relaxed">
                        Measures how well the model completed the task. Did it actually solve the problem or provide the specific output requested? 10 means perfect execution.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-[#202020] border border-notion-border/50">
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                        <Info size={16} />
                        <span className="font-semibold text-sm">Hallucination Rate</span>
                    </div>
                    <p className="text-xs text-notion-muted leading-relaxed">
                        Evaluates reliability. A high score here (BAD) means the model invented facts or gave false information. A low score (0-1) is ideal.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-[#202020] border border-notion-border/50">
                    <div className="flex items-center gap-2 mb-2 text-green-400">
                        <Info size={16} />
                        <span className="font-semibold text-sm">Response Format</span>
                    </div>
                    <p className="text-xs text-notion-muted leading-relaxed">
                        Did the model follow structural instructions (e.g., JSON, no markdown, specific word count)? High score means excellent adherence to format.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-[#202020] border border-notion-border/50">
                    <div className="flex items-center gap-2 mb-2 text-purple-400">
                        <Info size={16} />
                        <span className="font-semibold text-sm">Creativity</span>
                    </div>
                    <p className="text-xs text-notion-muted leading-relaxed">
                        Assesses novel ideas. Did the model provide generic fluff (low score) or offer unique, valuable insights and "out of the box" thinking (high score)?
                    </p>
                </div>
            </div>
        </div>
    );
};