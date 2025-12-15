import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface FeedbackData {
    rating: number | null;
    message: string;
    userContact: string;
    honeypot?: string; // Hidden field for spam detection
}

export interface FeedbackResult {
    success: boolean;
    error?: string;
}

interface UseFeedbackReturn {
    submitFeedback: (data: FeedbackData) => Promise<FeedbackResult>;
    canSubmit: boolean;
    cooldownRemaining: number;
    isSubmitting: boolean;
}

// ============================================
// Constants
// ============================================

const RATE_LIMIT_COOLDOWN = 5 * 60 * 1000; // 5 minutes between submissions
const STORAGE_KEY = 'feedback_last_submit';

// Supabase config - uses environment variables
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// ============================================
// Helpers
// ============================================

/**
 * Strip HTML tags from a string to prevent XSS
 */
function sanitizeHtml(input: string): string {
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&lt;/g, '<')   // Decode common entities
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
}

/**
 * Get remaining cooldown time in seconds
 */
function getCooldownRemaining(): number {
    const lastSubmit = localStorage.getItem(STORAGE_KEY);
    if (!lastSubmit) return 0;

    const elapsed = Date.now() - parseInt(lastSubmit, 10);
    const remaining = RATE_LIMIT_COOLDOWN - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// ============================================
// Hook
// ============================================

export function useFeedback(): UseFeedbackReturn {
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check cooldown on mount and update every second
    useEffect(() => {
        const updateCooldown = () => {
            setCooldownRemaining(getCooldownRemaining());
        };

        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);

        return () => clearInterval(interval);
    }, []);

    const submitFeedback = useCallback(async (data: FeedbackData): Promise<FeedbackResult> => {
        // Honeypot check - if filled, silently "succeed" but don't submit
        if (data.honeypot && data.honeypot.trim() !== '') {
            console.log('[Feedback] Honeypot triggered, blocking submission');
            // Return success to not tip off bots
            return { success: true };
        }

        // Rate limit check
        if (getCooldownRemaining() > 0) {
            return {
                success: false,
                error: `Please wait ${Math.ceil(getCooldownRemaining() / 60)} minutes before submitting again.`
            };
        }

        // Validation
        if (!data.rating && !data.message.trim()) {
            return {
                success: false,
                error: 'Please provide a rating or message.'
            };
        }

        // Check if Supabase is configured
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('[Feedback] Supabase not configured, logging locally');
            console.log('[Feedback] Would submit:', {
                rating: data.rating,
                message: sanitizeHtml(data.message),
                user_contact: data.userContact.trim() || null
            });
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
            setCooldownRemaining(RATE_LIMIT_COOLDOWN / 1000);
            return { success: true };
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/app_feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    rating: data.rating || null,
                    message: sanitizeHtml(data.message) || null,
                    user_contact: data.userContact.trim() || null
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Feedback] Supabase error:', errorText);
                return {
                    success: false,
                    error: 'Failed to submit feedback. Please try again.'
                };
            }

            // Record successful submission for rate limiting
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
            setCooldownRemaining(RATE_LIMIT_COOLDOWN / 1000);

            return { success: true };
        } catch (error) {
            console.error('[Feedback] Network error:', error);
            return {
                success: false,
                error: 'Network error. Please check your connection.'
            };
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        submitFeedback,
        canSubmit: cooldownRemaining === 0,
        cooldownRemaining,
        isSubmitting
    };
}
