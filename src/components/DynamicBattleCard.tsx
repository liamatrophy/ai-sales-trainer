import React, { useState } from 'react';
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

// Trigger examples for each checklist item - what to say to complete it
const CHECKLIST_TRIGGERS: Record<string, string> = {
    // Opening
    'Introduced yourself clearly': '"Hi, I\'m [Name] from [Company]..."',
    'Stated purpose without fluff': '"I\'m calling because we help companies like yours reduce [problem]..."',
    'Acknowledged their time': '"I know you\'re busy, I\'ll keep this brief..." or "Thanks for taking my call..."',
    'Built enthusiasm together': '"I\'m excited to share this with you..." + mirror their energy',
    'Established shared vision': '"Imagine if your team could..." or "What if you could..."',
    'Identified his influence level': '"Are you the one evaluating solutions for this?"',
    'Hooked in first 10 seconds': 'Lead with biggest impact: "We save companies like yours $X..."',
    'Respected time constraint': '"I\'ll be quick—just 60 seconds..."',
    'Got permission to continue': '"Do you have 2 minutes?" or "Is now a good time?"',
    'Set logical agenda': '"I\'d like to cover 3 things today: [1], [2], [3]..."',
    'Established credibility': '"We\'ve helped [similar company] achieve [result]..."',
    'Asked about evaluation criteria': '"What factors are most important in your decision?"',
    // Discovery
    'Asked about current process': '"How are you currently handling [X]?"',
    'Quantified the problem cost': '"What\'s that costing you in terms of time/money?"',
    'Identified decision criteria': '"What would a successful solution look like for you?"',
    'Explored his pain points': '"What challenges are you facing with [X]?"',
    'Identified boss priorities': '"What does your manager care most about?"',
    'Found budget holder': '"Who controls the budget for this type of solution?"',
    'Asked one sharp question': 'Single focused question: "What\'s your biggest challenge with [X]?"',
    'Got a pain point fast': 'Get them to admit a problem within 30 seconds',
    'Kept it under 30 seconds': 'Be concise—no rambling',
    'Drilled into metrics': '"What KPIs are you tracking?" or "What numbers matter?"',
    'Asked about tech stack': '"What tools are you using today?"',
    'Understood decision process': '"Walk me through your evaluation process..."',
    // Solution
    'Presented relevant case study': '"Company X had the same problem and saw Y% improvement..."',
    'Addressed ROI concerns': '"The ROI is typically X% within [timeframe]..."',
    'Handled skeptical pushback': 'Address objection directly without being defensive',
    'Armed him with talking points': '"Here\'s what you can tell your boss: [key points]..."',
    'Addressed implementation ease': '"Implementation takes just [X] days..."',
    'Highlighted quick wins': '"You\'ll see results in the first [week/month]..."',
    'Pitched in one sentence': 'Elevator pitch: "We do X for Y so they can Z"',
    'Tied to his priority': 'Connect your solution to what they said matters',
    'Offered proof briefly': 'Quick stat or testimonial, no long stories',
    'Provided technical detail': 'Answer specs questions precisely',
    'Showed integration path': '"It integrates with [their tools] via [method]..."',
    'Cited benchmarks': '"Industry benchmarks show [data]..."',
    // Closing
    'Proposed next step clearly': '"How about we schedule a demo for [specific day]?"',
    'Addressed final concerns': 'Handle last objection before asking for commitment',
    'Got commitment on timing': '"Can we lock in [day] at [time]?"',
    'Planned intro to decision maker': '"Can you loop me in with [boss name]?"',
    'Set up follow-up call': '"Let\'s schedule our next call for [date]..."',
    'Provided shareable materials': '"I\'ll send you a one-pager you can forward..."',
    'Asked for meeting directly': '"Let\'s book 15 minutes—Tuesday or Wednesday work?"',
    'Handled time objection': '"I understand, when would be a better time?"',
    'Confirmed next step': '"Great, so we\'re confirmed for [day] at [time]?"',
    'Proposed POC or trial': '"Would a pilot program help you evaluate?"',
    'Outlined evaluation timeline': '"Let\'s plan to decide by [date]..."',
    'Got technical buy-in': '"Does this meet your technical requirements?"',
};

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
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center text-blue-400">✓</span>
                        Checklist
                    </h4>
                    <p className="text-[10px] text-gray-500 mb-3 italic">💡 Hover items to see what to say</p>
                    <div className="space-y-2">
                        {checklistItems.map((item) => {
                            const trigger = CHECKLIST_TRIGGERS[item.label];
                            const isHovered = hoveredItem === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`
                                        relative flex items-start gap-2 p-2 rounded-lg transition-all duration-300 cursor-help
                                        ${item.completed
                                            ? 'bg-green-900/20 border border-green-500/30'
                                            : 'bg-gray-900/30 border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50'}
                                    `}
                                    onMouseEnter={() => setHoveredItem(item.id)}
                                    onMouseLeave={() => setHoveredItem(null)}
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

                                    {/* Tooltip */}
                                    {isHovered && trigger && !item.completed && (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-20 p-2 bg-gray-900 border border-blue-500/50 rounded-lg shadow-lg animate-in fade-in zoom-in-95 duration-150">
                                            <p className="text-[10px] text-blue-400 font-semibold mb-1">SAY THIS:</p>
                                            <p className="text-xs text-gray-200 italic">{trigger}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
