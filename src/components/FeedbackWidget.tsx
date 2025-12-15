import React, { useState, useEffect } from 'react';
import { useFeedback, FeedbackData } from '../hooks/useFeedback';

// ============================================
// Star Rating Component
// ============================================

interface StarRatingProps {
    value: number;
    onChange: (rating: number) => void;
    disabled?: boolean;
}

function StarRating({ value, onChange, disabled }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState(0);

    const displayValue = hoverValue || value;

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    className={`text-2xl transition-all duration-150 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
                        }`}
                    onClick={() => !disabled && onChange(star)}
                    onMouseEnter={() => !disabled && setHoverValue(star)}
                    onMouseLeave={() => setHoverValue(0)}
                    aria-label={`Rate ${star} stars`}
                >
                    <span
                        className={`${star <= displayValue
                            ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]'
                            : 'text-gray-500'
                            }`}
                    >
                        ★
                    </span>
                </button>
            ))}
        </div>
    );
}

// ============================================
// Main Feedback Widget
// ============================================

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [userContact, setUserContact] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { submitFeedback, canSubmit, cooldownRemaining, isSubmitting } = useFeedback();

    // Auto-expand on desktop, stay collapsed on mobile
    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        if (isDesktop) setIsOpen(true);
    }, []);

    const isFormValid = rating > 0 || message.trim().length > 0;
    const isDisabled = !canSubmit || isSubmitting;
    const isMobile = typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const data: FeedbackData = {
            rating: rating > 0 ? rating : null,
            message,
            userContact,
            honeypot
        };

        const result = await submitFeedback(data);

        if (result.success) {
            setShowSuccess(true);
            setRating(0);
            setMessage('');
            setUserContact('');
            setHoneypot('');

            // Hide success and close after delay
            setTimeout(() => {
                setShowSuccess(false);
                setIsOpen(false);
            }, 2000);
        } else {
            setError(result.error || 'Something went wrong');
        }
    };

    const formatCooldown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
          bg-gradient-to-br from-indigo-500 to-purple-600 
          text-white shadow-lg shadow-indigo-500/30
          hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105
          transition-all duration-300 flex items-center justify-center
          ${isOpen ? 'rotate-45' : ''}
          ${!isOpen && isMobile ? 'animate-pulse-subtle' : ''}`}
                aria-label={isOpen ? 'Close feedback' : 'Open feedback'}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>

            {/* Feedback Card */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-80 
            bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 
            rounded-2xl shadow-2xl shadow-black/50
            animate-in slide-in-from-bottom-4 fade-in duration-300"
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            Help us improve
                        </h3>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Success Message */}
                        {showSuccess && (
                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm text-center">
                                ✓ Thank you for your feedback!
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Cooldown Warning */}
                        {!canSubmit && !showSuccess && (
                            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
                                Please wait {formatCooldown(cooldownRemaining)} before submitting again.
                            </div>
                        )}

                        {!showSuccess && (
                            <>
                                {/* Star Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        How's your experience?
                                    </label>
                                    <StarRating value={rating} onChange={setRating} disabled={isDisabled} />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Tell us more <span className="text-gray-500">(optional)</span>
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={isDisabled}
                                        placeholder="What can we do better?"
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2
                      text-white placeholder-gray-500 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      resize-none transition-all"
                                    />
                                </div>

                                {/* Contact (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Contact <span className="text-gray-500">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={userContact}
                                        onChange={(e) => setUserContact(e.target.value)}
                                        disabled={isDisabled}
                                        placeholder="Email or name (if you'd like a response)"
                                        maxLength={100}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2
                      text-white placeholder-gray-500 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all"
                                    />
                                </div>

                                {/* Honeypot - Hidden from real users */}
                                <input
                                    type="text"
                                    name="website_url"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                    style={{
                                        position: 'absolute',
                                        left: '-9999px',
                                        opacity: 0,
                                        pointerEvents: 'none'
                                    }}
                                />

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!isFormValid || isDisabled}
                                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${isFormValid && !isDisabled
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Feedback'
                                    )}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            )}
        </>
    );
}
