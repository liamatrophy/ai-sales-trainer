import React from 'react';

interface RankBadgeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

// Score to rank mapping
function getRankFromScore(score: number): { rank: string; color: string; bgColor: string; animation: string } {
    if (score >= 90) return { rank: 'S', color: 'text-yellow-300', bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-600', animation: 'animate-pulse' };
    if (score >= 80) return { rank: 'A', color: 'text-green-400', bgColor: 'bg-gradient-to-br from-green-500 to-emerald-700', animation: '' };
    if (score >= 70) return { rank: 'B', color: 'text-blue-400', bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-700', animation: '' };
    if (score >= 60) return { rank: 'C', color: 'text-yellow-500', bgColor: 'bg-gradient-to-br from-yellow-500 to-orange-600', animation: '' };
    if (score >= 40) return { rank: 'D', color: 'text-orange-400', bgColor: 'bg-gradient-to-br from-orange-500 to-red-600', animation: '' };
    return { rank: 'F', color: 'text-red-400', bgColor: 'bg-gradient-to-br from-red-500 to-red-800', animation: 'animate-shake' };
}

const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-28 h-28 text-6xl',
};

export function RankBadge({ score, size = 'lg' }: RankBadgeProps) {
    const { rank, color, bgColor, animation } = getRankFromScore(score);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`
                ${sizeClasses[size]}
                ${bgColor}
                ${animation}
                rounded-full
                flex items-center justify-center
                font-black text-white
                shadow-lg shadow-black/30
                border-4 border-white/20
                relative
                overflow-hidden
            `}>
                {/* Shine effect for S rank */}
                {rank === 'S' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
                <span className="relative z-10 drop-shadow-lg">{rank}</span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>
                {rank === 'S' ? 'Supreme' :
                    rank === 'A' ? 'Excellent' :
                        rank === 'B' ? 'Good' :
                            rank === 'C' ? 'Average' :
                                rank === 'D' ? 'Below Avg' : 'Needs Work'}
            </span>
        </div>
    );
}

// Add shake animation to tailwind (add to global CSS or tailwind config)
// @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
// .animate-shake { animation: shake 0.5s ease-in-out infinite; }
