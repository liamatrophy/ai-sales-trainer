import React, { useState, useEffect } from 'react';

// Inline hint component with animated enter/exit
export function CopilotHintBubble({ hint, isLoading }: { hint: string | null; isLoading: boolean }) {
    const [isVisible, setIsVisible] = useState(false);
    const [displayedHint, setDisplayedHint] = useState<string | null>(null);

    useEffect(() => {
        if (hint || isLoading) {
            setDisplayedHint(hint);
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
            // Wait for exit animation before clearing
            const timer = setTimeout(() => {
                setDisplayedHint(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [hint, isLoading]);

    if (!displayedHint && !isLoading) return null;

    return (
        <div
            className={`flex justify-end mb-3 transition-all duration-300 ease-out ${isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-2 scale-95'
                }`}
        >
            <div className="max-w-[80%] bg-gradient-to-r from-cyan-900/80 to-blue-900/80 backdrop-blur-sm border border-cyan-500/40 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-cyan-900/20">
                <div className="flex items-start gap-2">
                    <span className="text-base animate-pulse">{isLoading ? '🤔' : '💡'}</span>
                    <div>
                        {isLoading ? (
                            <p className="text-sm text-cyan-200 italic">Thinking...</p>
                        ) : (
                            <>
                                <p className="text-xs text-cyan-400 font-medium mb-1">Say this:</p>
                                <p className="text-sm text-cyan-100">{displayedHint}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Toggle component for setup screen
export function CopilotToggle({ isEnabled, onToggle }: { isEnabled: boolean; onToggle: (enabled: boolean) => void }) {
    return (
        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-700/50 bg-gray-800/30 hover:bg-gray-800 transition-colors cursor-pointer">
            <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => onToggle(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-cyan-600 focus:ring-offset-gray-900"
            />
            <div>
                <span className="text-sm text-gray-300 font-medium">🎓 Training Wheels Mode</span>
                <p className="text-xs text-gray-500">Get real-time coaching tips as you talk</p>
            </div>
        </label>
    );
}
