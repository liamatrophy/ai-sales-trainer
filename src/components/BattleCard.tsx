import React from 'react';
import { Persona, Difficulty, ObjectionType } from '../types';
import { PERSONA_DETAILS, PERSONA_COLORS, OBJECTION_DETAILS, OBJECTION_PIVOTS } from '../constants';

interface BattleCardProps {
    persona: Persona;
    difficulty: Difficulty;
    selectedObjections: ObjectionType[];
    interestLevel: number;
}

export function BattleCard({ persona, difficulty, selectedObjections, interestLevel }: BattleCardProps) {
    const details = PERSONA_DETAILS[persona];
    const colors = PERSONA_COLORS[persona];
    const isRecoveryMode = interestLevel < 25;

    return (
        <div className={`bg-gray-800/80 border rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-500 ${isRecoveryMode ? 'border-red-500/70 shadow-lg shadow-red-900/30' : 'border-gray-700'
            }`}>
            {/* Header */}
            <div className={`p-4 border-b ${isRecoveryMode ? 'bg-red-900/30 border-red-500/30' : 'bg-gray-800 border-gray-700'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <div>
                        <h3 className={`font-bold ${colors.text}`}>
                            {details.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {difficulty}
                        </span>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">

                {/* Recovery Mode Alert */}
                {isRecoveryMode && (
                    <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-lg animate-pulse">
                        <p className="text-red-400 font-bold text-xs mb-1">🚨 DANGER ZONE</p>
                        <p className="text-red-300 text-xs">Try an apology or empathy statement to recover!</p>
                    </div>
                )}

                {/* Do's & Don'ts */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        💬 Do's & Don'ts
                    </h4>
                    <ul className="space-y-1">
                        {details.dosDonts.map((item, i) => (
                            <li key={i} className="text-xs text-gray-300">{item}</li>
                        ))}
                    </ul>
                </div>

                {/* Flow Script */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        📋 The Flow
                    </h4>
                    <div className="space-y-2">
                        <div className="p-2 bg-gray-900/50 rounded border-l-2 border-blue-500">
                            <span className="text-[10px] text-blue-400 font-bold">INTRO</span>
                            <p className="text-xs text-gray-300 italic">"{details.flowScript.intro}"</p>
                        </div>
                        <div className="p-2 bg-gray-900/50 rounded border-l-2 border-purple-500">
                            <span className="text-[10px] text-purple-400 font-bold">PAIN</span>
                            <p className="text-xs text-gray-300 italic">"{details.flowScript.pain}"</p>
                        </div>
                        <div className="p-2 bg-gray-900/50 rounded border-l-2 border-green-500">
                            <span className="text-[10px] text-green-400 font-bold">ASK</span>
                            <p className="text-xs text-gray-300 italic">"{details.flowScript.ask}"</p>
                        </div>
                    </div>
                </div>

                {/* Objection Cheat Codes */}
                {selectedObjections.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            🎯 Cheat Codes
                        </h4>
                        <div className="space-y-2">
                            {selectedObjections.map(obj => {
                                const pivot = OBJECTION_PIVOTS[obj];
                                const objDetail = OBJECTION_DETAILS[obj];
                                return (
                                    <div key={obj} className="p-2 bg-orange-900/20 border border-orange-500/30 rounded">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm">{objDetail.icon}</span>
                                            <span className="text-[10px] text-orange-400">{pivot.trigger}</span>
                                        </div>
                                        <p className="text-xs text-gray-200 font-medium">{pivot.pivot}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
