// types.ts

export enum Persona {
    SKEPTICAL = 'Skeptic Susan',
    EAGER = 'Eager Eric',
    BUSY = 'Busy Brian',
    ANALYTICAL = 'Analytical Anna',
}

export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

export enum ObjectionType {
    TIMING = "Timing",
    BUDGET = "Budget",
    SOLUTION = "Already have a solution",
    CREDIBILITY = "Credibility / Trust",
    STALL = "Need more info / Stall",
}

// 4-Stage Sales Pipeline
export enum SalesStage {
    OPENING = 'opening',
    DISCOVERY = 'discovery',
    SOLUTION = 'solution',
    CLOSING = 'closing',
}

// Sentiment for message bubbles
export type Sentiment = 'red' | 'orange' | 'green';

// Checklist item for dynamic battle card
export interface StageChecklistItem {
    id: string;
    label: string;
    completed: boolean;
}

export interface Transcript {
    id: string;
    speaker: 'user' | 'ai';
    text: string;
    sentiment?: Sentiment;
}

// --- New Types for Feedback and Timers ---

export type Outcome = "Booked" | "Tentative Next Step" | "Stalled" | "Disqualified";
export type Badge = "Objection Ninja" | "Timebox Titan" | "Discovery Diver" | "Gatekeeper Slayer" | "Calm Closer";

export interface FeedbackReport {
    type: "feedback_report";
    overall_score: number;
    dimensions: {
        discovery_depth: number;
        objection_handling: number;
        clarity_brevity: number;
        next_step_secured: number;
        rapport_tone: number;
        talk_ratio: number;
    };
    wins: string[];
    fix_next: string[];
    one_liner_repair: string[];
    next_call_mission: string;
    outcome: Outcome;
    xp_awarded: number;
    streak: number;
    badges: Badge[];
}

export interface TimerEvent {
    type: "timer_event";
    mode: "non_realtime" | "realtime";
    phase: "listening" | "transcribing" | "replying" | "realtime_speaking";
    status: "start" | "end";
    ts_hint_ms?: number | null;
}
