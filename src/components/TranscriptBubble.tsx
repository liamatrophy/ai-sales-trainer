import React from 'react';
import { Transcript, Sentiment } from '../types';
import { Icon } from './Icon';

interface TranscriptBubbleProps {
    transcript: Transcript;
    isLive?: boolean;
    sentiment?: Sentiment;
}

const SENTIMENT_COLORS: Record<Sentiment, string> = {
    red: 'border-l-4 border-l-red-500',
    orange: 'border-l-4 border-l-yellow-500',
    green: 'border-l-4 border-l-green-500',
};

export const TranscriptBubble: React.FC<TranscriptBubbleProps> = ({
    transcript,
    isLive = false,
    sentiment
}) => {
    const isUser = transcript.speaker === 'user';

    // Use sentiment from props or from transcript
    const effectiveSentiment = sentiment || transcript.sentiment;

    const bubbleClasses = isUser
        ? 'bg-blue-600 rounded-br-none'
        : 'bg-gray-700 rounded-bl-none';

    const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';

    const textColor = isLive ? 'text-gray-400' : 'text-white';

    // Apply sentiment border only to AI messages
    const sentimentClass = !isUser && effectiveSentiment ? SENTIMENT_COLORS[effectiveSentiment] : '';

    if (!transcript.text) return null;

    return (
        <div className={`flex items-start gap-3 w-full ${containerClasses}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-gray-600'}`}>
                <Icon type={isUser ? 'user' : 'ai'} className="w-5 h-5" />
            </div>
            <div className={`max-w-[80%] p-3 rounded-lg ${bubbleClasses} ${sentimentClass}`}>
                <p className={`text-sm md:text-base ${textColor}`}>
                    {transcript.text}
                </p>
            </div>
        </div>
    );
};
