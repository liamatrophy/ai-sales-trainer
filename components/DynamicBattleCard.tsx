import React from 'react';
import { Persona, SalesStage, StageChecklistItem } from '../types';
import { PERSONA_DETAILS, PERSONA_STAGE_MATRIX, STAGE_CONFIG } from '../constants';
import { Icon } from './Icon';

interface DynamicBattleCardProps {
    persona: Persona;
    currentStage: SalesStage;
    checklistItems: StageChecklistItem[];
    difficulty: string;
    isAiSpeaking?: boolean;
    volume?: number;
}

export const DynamicBattleCard: React.FC<DynamicBattleCardProps> = ({
    persona,
    currentStage,
    checklistItems,
    difficulty,
    isAiSpeaking = false,
    volume = 0,
}) => {
    const personaDetails = PERSONA_DETAILS[persona];
    const stageData = PERSONA_STAGE_MATRIX[persona][currentStage];
    const stageConfig = STAGE_CONFIG[currentStage];

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl flex flex-col h-full overflow-hidden">
            {/* Persona Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/80 relative overflow-hidden">
                <div className={`absolute inset-0 opacity-10 ${isAiSpeaking ? 'bg-blue-500 animate-pulse' : ''}`} />

                <div className="flex items-center gap-3 relative z-10">
                    {/* Avatar with volume effect */}
                    <div className="relative">
                        <div
                            className="absolute inset-0 bg-blue-500/30 rounded-full blur-lg transition-all duration-75"
                            style={{ transform: `scale(${1 + volume * 0.5})`, opacity: 0.3 + volume * 0.5 }}
                        />
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-600 relative z-10">
                            <Icon type="user" className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-white">{personaDetails.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`
                                text-xs px-2 py-0.5 rounded-full font-medium
                                ${difficulty === 'easy' ? 'bg-green-900/30 text-green-400' : ''}
                                ${difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400' : ''}
                                ${difficulty === 'hard' ? 'bg-red-900/30 text-red-400' : ''}
                            `}>
                                {difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Stage Indicator */}
            <div className="px-4 py-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        Stage: {stageConfig.label}
                    </span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Checklist Section */}
                <div className="p-4 border-b border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center text-blue-400">✓</span>
                        Checklist
                    </h4>
                    <div className="space-y-2">
                        {checklistItems.map((item) => (
                            <div
                                key={item.id}
                                className={`
                                    flex items-start gap-2 p-2 rounded-lg transition-all duration-300
                                    ${item.completed
                                        ? 'bg-green-900/20 border border-green-500/30'
                                        : 'bg-gray-900/30 border border-gray-700/50'}
                                `}
                            >
                                <div className={`
                                    w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                                    ${item.completed
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-700 text-gray-500'}
                                `}>
                                    {item.completed ? '✓' : '○'}
                                </div>
                                <span className={`
                                    text-sm transition-all
                                    ${item.completed ? 'text-green-300 line-through' : 'text-gray-300'}
                                `}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Smart Tips Section */}
                <div className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <span className="w-4 h-4 bg-yellow-500/20 rounded flex items-center justify-center text-yellow-400">💡</span>
                        Smart Tips
                    </h4>
                    <div className="space-y-2">
                        {stageData.tips.map((tip, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-2 text-sm text-gray-300"
                            >
                                <span className="text-yellow-500 flex-shrink-0">•</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
