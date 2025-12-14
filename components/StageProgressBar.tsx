import React from 'react';
import { SalesStage } from '../types';
import { STAGE_CONFIG } from '../constants';

interface StageProgressBarProps {
    currentStage: SalesStage;
    interestLevel: number;
    onStageOverride?: (stage: SalesStage) => void;
}

const STAGES_ORDER: SalesStage[] = [
    SalesStage.OPENING,
    SalesStage.DISCOVERY,
    SalesStage.SOLUTION,
    SalesStage.CLOSING,
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
    currentStage,
    interestLevel,
    onStageOverride,
}) => {
    const currentIndex = STAGES_ORDER.indexOf(currentStage);

    const getInterestColor = (val: number) => {
        if (val < 30) return 'text-red-400';
        if (val < 60) return 'text-yellow-400';
        return 'text-green-400';
    };

    const getInterestBgColor = (val: number) => {
        if (val < 30) return 'from-red-500 to-red-600';
        if (val < 60) return 'from-yellow-500 to-orange-500';
        return 'from-green-500 to-emerald-500';
    };

    return (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-4">
            {/* Header with Interest Gauge label and percentage */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-300">Interest Gauge</span>
                <span className={`text-sm font-mono font-bold ${getInterestColor(interestLevel)}`}>
                    {interestLevel}%
                </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="flex gap-1 mb-3">
                {STAGES_ORDER.map((stage, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;
                    const isFuture = index > currentIndex;
                    const config = STAGE_CONFIG[stage];

                    return (
                        <button
                            key={stage}
                            onClick={() => onStageOverride?.(stage)}
                            disabled={!onStageOverride}
                            className={`
                                flex-1 h-3 rounded-full transition-all duration-500 relative overflow-hidden
                                ${onStageOverride ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                                ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
                                ${isActive ? `bg-gradient-to-r ${getInterestBgColor(interestLevel)} shadow-lg` : ''}
                                ${isFuture ? 'bg-gray-700/50' : ''}
                            `}
                            title={`${config.label}: ${config.directive}`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Stage Labels */}
            <div className="flex gap-1 mb-4">
                {STAGES_ORDER.map((stage, index) => {
                    const isActive = index === currentIndex;
                    const config = STAGE_CONFIG[stage];

                    return (
                        <div
                            key={stage}
                            className={`
                                flex-1 text-center text-xs font-medium transition-all duration-300
                                ${isActive ? 'text-white' : 'text-gray-500'}
                            `}
                        >
                            {config.label}
                        </div>
                    );
                })}
            </div>

            {/* Prime Directive */}
            <div className="bg-gray-900/50 rounded-lg p-3 border-l-4 border-blue-500">
                <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">
                    Prime Directive
                </p>
                <p className="text-sm text-gray-200">
                    {STAGE_CONFIG[currentStage].directive}
                </p>
            </div>

            {/* Manual Override Buttons (for testing) */}
            {onStageOverride && (
                <div className="mt-3 flex gap-2">
                    {STAGES_ORDER.map((stage) => {
                        const isActive = stage === currentStage;
                        return (
                            <button
                                key={stage}
                                onClick={() => onStageOverride(stage)}
                                className={`
                                    flex-1 py-1.5 text-xs font-medium rounded-md transition-all
                                    ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}
                                `}
                            >
                                {STAGE_CONFIG[stage].label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
