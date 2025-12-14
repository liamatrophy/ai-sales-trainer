import React from 'react';

export interface SpeakerSegment {
    speaker: 'user' | 'ai';
    startMs: number;
    endMs: number;
}

interface TalkRatioTimelineProps {
    segments: SpeakerSegment[];
    totalDurationMs: number;
    interruptions?: number[]; // Timestamps in ms where interruptions occurred
}

export function TalkRatioTimeline({ segments, totalDurationMs, interruptions = [] }: TalkRatioTimelineProps) {
    if (segments.length === 0 || totalDurationMs === 0) {
        return null;
    }

    // Calculate talk time percentages
    const userTimeMs = segments
        .filter(s => s.speaker === 'user')
        .reduce((sum, s) => sum + (s.endMs - s.startMs), 0);

    const aiTimeMs = segments
        .filter(s => s.speaker === 'ai')
        .reduce((sum, s) => sum + (s.endMs - s.startMs), 0);

    const userPercent = Math.round((userTimeMs / totalDurationMs) * 100);
    const aiPercent = Math.round((aiTimeMs / totalDurationMs) * 100);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                    <span className="text-lg">⚖️</span> Talk vs Listen
                </h3>
                <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        You ({userPercent}%)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                        AI ({aiPercent}%)
                    </span>
                </div>
            </div>

            {/* Timeline bar */}
            <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
                {segments.map((segment, i) => {
                    const left = (segment.startMs / totalDurationMs) * 100;
                    const width = ((segment.endMs - segment.startMs) / totalDurationMs) * 100;
                    return (
                        <div
                            key={i}
                            className={`absolute top-0 bottom-0 ${segment.speaker === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                                }`}
                            style={{
                                left: `${left}%`,
                                width: `${width}%`,
                            }}
                        />
                    );
                })}

                {/* Interruption markers */}
                {interruptions.map((ts, i) => (
                    <div
                        key={`int-${i}`}
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                        style={{ left: `${(ts / totalDurationMs) * 100}%` }}
                        title="Interruption"
                    />
                ))}
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0:00</span>
                <span>{formatTime(totalDurationMs / 1000)}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 text-center text-xs">
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-blue-400 font-bold">{formatTime(userTimeMs / 1000)}</div>
                    <div className="text-gray-500">You talked</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-gray-400 font-bold">{formatTime(aiTimeMs / 1000)}</div>
                    <div className="text-gray-500">AI talked</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-red-400 font-bold">{interruptions.length}</div>
                    <div className="text-gray-500">Interruptions</div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
