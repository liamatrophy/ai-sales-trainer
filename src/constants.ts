// constants.ts
import { Persona, Difficulty, ObjectionType, Transcript, SalesStage } from './types';

export const PERSONA_DETAILS: Record<Persona, {
    name: string;
    description: string;
    tip: string;
    dosDonts: string[];
    flowScript: { intro: string; pain: string; ask: string };
}> = {
    [Persona.SKEPTICAL]: {
        name: 'Skeptic Susan',
        description: 'A cautious procurement manager who is resistant to change and needs solid proof (data, case studies) to be convinced.',
        tip: 'Lead with data and social proof. Address her concerns directly and avoid fluffy marketing language.',
        dosDonts: [
            "⚠️ Hates fluff and small talk",
            "📉 Needs hard ROI numbers",
            "❌ Don't ask 'how are you today'",
            "✅ Lead with case studies",
            "✅ Mention specific metrics"
        ],
        flowScript: {
            intro: "Hi Susan, calling about [Problem]. Not sure if it's a fit...",
            pain: "What's your current process for handling [X]?",
            ask: "Would a 15-min demo make sense if I show you how [Client] saved 30%?"
        }
    },
    [Persona.EAGER]: {
        name: 'Eager Eric',
        description: 'An enthusiastic junior employee who loves new tech but has no buying power. He\'s your internal champion.',
        tip: 'Win him over, then arm him with the key points and ROI to sell your solution internally to his boss.',
        dosDonts: [
            "🎯 Has no budget authority",
            "✅ Arm him with talking points",
            "✅ Ask who the decision maker is",
            "❌ Don't pitch hard - he can't buy",
            "✅ Make him your champion"
        ],
        flowScript: {
            intro: "Hey Eric! Heard you're looking into [Tech]...",
            pain: "What's blocking your team from solving [X] today?",
            ask: "Who else would need to sign off? Want me to send you a one-pager?"
        }
    },
    [Persona.BUSY]: {
        name: 'Busy Brian',
        description: 'A distracted executive who is always short on time and multitasking. He values brevity and immediate value.',
        tip: 'Get to the point fast. Open with a powerful hook and focus on the single biggest impact you can make.',
        dosDonts: [
            "⏱️ You have 30 seconds MAX",
            "❌ Don't ramble or explain",
            "❌ Skip the pleasantries",
            "✅ Lead with impact/hook",
            "✅ Ask one question only"
        ],
        flowScript: {
            intro: "Brian, 30 seconds - we help [Role] cut [Problem] by 40%.",
            pain: "Is [specific problem] even on your radar right now?",
            ask: "Worth a 10-min call Tuesday or Wednesday?"
        }
    },
    [Persona.ANALYTICAL]: {
        name: 'Analytical Anna',
        description: 'A detail-oriented engineer or CFO who drills down into technical specs and ROI. She is logical and data-driven.',
        tip: 'Be prepared for specific, technical questions. Have your numbers and specs ready and be precise in your answers.',
        dosDonts: [
            "📊 Wants exact numbers",
            "🔧 Will ask technical questions",
            "❌ Don't guess or be vague",
            "✅ Provide documentation",
            "✅ Say 'I'll find out' if unsure"
        ],
        flowScript: {
            intro: "Anna, calling about [Product]. You likely have questions...",
            pain: "What metrics are you tracking for [Process]?",
            ask: "I can send specs and a ROI calculator - want to review first?"
        }
    },
};

// Objection pivot strategies for BattleCard
export const OBJECTION_PIVOTS: Record<ObjectionType, { trigger: string; pivot: string }> = {
    [ObjectionType.TIMING]: {
        trigger: '"Not a good time"',
        pivot: 'Ask: "When does your fiscal year end?"'
    },
    [ObjectionType.BUDGET]: {
        trigger: '"Too expensive"',
        pivot: 'Pivot to: "Cost of doing nothing"'
    },
    [ObjectionType.SOLUTION]: {
        trigger: '"We already have someone"',
        pivot: 'Ask: "How long have you been with them?"'
    },
    [ObjectionType.CREDIBILITY]: {
        trigger: '"Who else uses this?"',
        pivot: 'Name drop: "[Similar Company] saw X results"'
    },
    [ObjectionType.STALL]: {
        trigger: '"Send me info"',
        pivot: 'Reply: "Sure - what would make it worth reading?"'
    }
};

// Persona color schemes for cards
export const PERSONA_COLORS: Record<Persona, { bg: string; border: string; ring: string; text: string }> = {
    [Persona.SKEPTICAL]: {
        bg: 'bg-purple-600/10',
        border: 'border-purple-500',
        ring: 'ring-purple-500/50',
        text: 'text-purple-400'
    },
    [Persona.EAGER]: {
        bg: 'bg-green-400/10',
        border: 'border-green-400',
        ring: 'ring-green-400/50',
        text: 'text-green-400'
    },
    [Persona.BUSY]: {
        bg: 'bg-red-500/10',
        border: 'border-red-500',
        ring: 'ring-red-500/50',
        text: 'text-red-400'
    },
    [Persona.ANALYTICAL]: {
        bg: 'bg-white/10',
        border: 'border-white/70',
        ring: 'ring-white/50',
        text: 'text-white'
    },
};

// Objection details with icons
export const OBJECTION_DETAILS: Record<ObjectionType, { label: string; icon: string }> = {
    [ObjectionType.TIMING]: {
        icon: "⏱️",
        label: "Timing objections (e.g., \"now isn't a good time\", \"let's revisit later\")"
    },
    [ObjectionType.BUDGET]: {
        icon: "💰",
        label: "Budget objections (e.g., \"pricing is unclear\", \"we don't have budget allocated\")"
    },
    [ObjectionType.SOLUTION]: {
        icon: "🔄",
        label: "Already have a solution (e.g., \"we already work with someone\", \"we're locked into a vendor\")"
    },
    [ObjectionType.CREDIBILITY]: {
        icon: "🛡️",
        label: "Credibility / trust objections (e.g., \"have you done this before?\", \"who else uses this?\")"
    },
    [ObjectionType.STALL]: {
        icon: "✋",
        label: "Need more info / stall (e.g., \"send me something\", \"let me review internally\")"
    }
};

// Short labels for objection toggle buttons
export const OBJECTION_BUTTON_LABELS: Record<ObjectionType, string> = {
    [ObjectionType.TIMING]: 'Time',
    [ObjectionType.BUDGET]: 'Budget',
    [ObjectionType.SOLUTION]: 'Competitor',
    [ObjectionType.CREDIBILITY]: 'Trust',
    [ObjectionType.STALL]: 'Proof',
};

// 4 unique objections per persona
export const PERSONA_OBJECTIONS: Record<Persona, ObjectionType[]> = {
    [Persona.SKEPTICAL]: [ObjectionType.CREDIBILITY, ObjectionType.STALL, ObjectionType.BUDGET, ObjectionType.SOLUTION],
    [Persona.EAGER]: [ObjectionType.BUDGET, ObjectionType.TIMING, ObjectionType.STALL, ObjectionType.CREDIBILITY],
    [Persona.BUSY]: [ObjectionType.TIMING, ObjectionType.BUDGET, ObjectionType.STALL, ObjectionType.SOLUTION],
    [Persona.ANALYTICAL]: [ObjectionType.STALL, ObjectionType.BUDGET, ObjectionType.CREDIBILITY, ObjectionType.SOLUTION],
};

// Stage configuration with labels, directives, and colors
export const STAGE_CONFIG: Record<SalesStage, { label: string; directive: string; color: string }> = {
    [SalesStage.OPENING]: {
        label: 'Opening',
        directive: 'Build rapport and set the agenda for the call.',
        color: 'from-blue-500 to-cyan-500'
    },
    [SalesStage.DISCOVERY]: {
        label: 'Discovery',
        directive: 'Dig deeper into the financial impact of their problem.',
        color: 'from-cyan-500 to-green-500'
    },
    [SalesStage.SOLUTION]: {
        label: 'Solution',
        directive: 'Present your solution and handle objections confidently.',
        color: 'from-green-500 to-yellow-500'
    },
    [SalesStage.CLOSING]: {
        label: 'Closing',
        directive: 'Stop selling and ask for the specific meeting time.',
        color: 'from-yellow-500 to-orange-500'
    },
};

// Persona + Stage Matrix with checklists and tips
export const PERSONA_STAGE_MATRIX: Record<Persona, Record<SalesStage, { checklist: string[]; tips: string[] }>> = {
    [Persona.SKEPTICAL]: {
        [SalesStage.OPENING]: {
            checklist: ['Introduced yourself clearly', 'Stated purpose without fluff', 'Acknowledged their time'],
            tips: ['Skip small talk—she hates it', 'Mention you have data ready', 'Lead with a credibility statement']
        },
        [SalesStage.DISCOVERY]: {
            checklist: ['Asked about current process', 'Quantified the problem cost', 'Identified decision criteria'],
            tips: ['Ask for hard numbers', 'Avoid vague buzzwords', 'Lead with ROI questions']
        },
        [SalesStage.SOLUTION]: {
            checklist: ['Presented relevant case study', 'Addressed ROI concerns', 'Handled skeptical pushback'],
            tips: ['Use specific metrics', 'Cite competitor wins', 'Offer a pilot program']
        },
        [SalesStage.CLOSING]: {
            checklist: ['Proposed next step clearly', 'Addressed final concerns', 'Got commitment on timing'],
            tips: ['Focus on risk mitigation', 'Summarize ROI one more time', 'Be direct—ask for the meeting']
        },
    },
    [Persona.EAGER]: {
        [SalesStage.OPENING]: {
            checklist: ['Built enthusiasm together', 'Established shared vision', 'Identified his influence level'],
            tips: ['Match his energy', 'Ask who else should know', 'Plant seeds for internal sale']
        },
        [SalesStage.DISCOVERY]: {
            checklist: ['Explored his pain points', 'Identified boss priorities', 'Found budget holder'],
            tips: ["Ask about his boss's goals", 'Uncover internal politics', 'Help him build his pitch']
        },
        [SalesStage.SOLUTION]: {
            checklist: ['Armed him with talking points', 'Addressed implementation ease', 'Highlighted quick wins'],
            tips: ['Give him soundbites to repeat', 'Focus on ease of adoption', 'Create urgency via FOMO']
        },
        [SalesStage.CLOSING]: {
            checklist: ['Planned intro to decision maker', 'Set up follow-up call', 'Provided shareable materials'],
            tips: ['Ask to loop in his boss', 'Offer a deck he can forward', 'Set a concrete next step']
        },
    },
    [Persona.BUSY]: {
        [SalesStage.OPENING]: {
            checklist: ['Hooked in first 10 seconds', 'Respected time constraint', 'Got permission to continue'],
            tips: ['Lead with biggest impact', 'Ask: "Do you have 90 seconds?"', 'Skip pleasantries']
        },
        [SalesStage.DISCOVERY]: {
            checklist: ['Asked one sharp question', 'Got a pain point fast', 'Kept it under 30 seconds'],
            tips: ['One question max per turn', 'Focus on bottom-line impact', "Don't over-explain"]
        },
        [SalesStage.SOLUTION]: {
            checklist: ['Pitched in one sentence', 'Tied to his priority', 'Offered proof briefly'],
            tips: ['Elevator pitch only', 'Name-drop if relevant', 'Avoid feature lists']
        },
        [SalesStage.CLOSING]: {
            checklist: ['Asked for meeting directly', 'Handled time objection', 'Confirmed next step'],
            tips: ['Ask for the meeting NOW', "Don't recap features", 'Suggest specific dates']
        },
    },
    [Persona.ANALYTICAL]: {
        [SalesStage.OPENING]: {
            checklist: ['Set logical agenda', 'Established credibility', 'Asked about evaluation criteria'],
            tips: ['Be structured and precise', 'Avoid superlatives', 'Signal you have data coming']
        },
        [SalesStage.DISCOVERY]: {
            checklist: ['Drilled into metrics', 'Asked about tech stack', 'Understood decision process'],
            tips: ['Ask about their KPIs', "Don't assume—verify", 'Take notes visibly']
        },
        [SalesStage.SOLUTION]: {
            checklist: ['Provided technical detail', 'Showed integration path', 'Cited benchmarks'],
            tips: ['Have specs ready', 'Mention security/compliance', 'Avoid "trust me" language']
        },
        [SalesStage.CLOSING]: {
            checklist: ['Proposed POC or trial', 'Outlined evaluation timeline', 'Got technical buy-in'],
            tips: ['Offer a technical deep-dive', 'Propose a pilot with metrics', 'Confirm next technical call']
        },
    },
};


const BASE_CONVERSATION_INSTRUCTION = `
You are an AI sales simulation engine playing the role of a realistic prospect in a sales call.

========================
YOUR ROLE: THE PERSONA
========================
- **WHO YOU ARE**: A realistic prospect in a sales call (persona details below).
- **YOUR GOAL**: Be a tough but winnable buyer. React naturally to the user's pitch.
- **TONE**: Dismissive by default, but willing to engage if the user says the right things.

========================
TURN STRUCTURE (MANDATORY ON EVERY TURN)
========================
On EVERY turn (including the first), you MUST call these tools IN THIS ORDER before speaking:

1. **set_interest_level** - REQUIRED. Current score 0-100.
2. **set_sentiment** - REQUIRED. How you feel: "red", "orange", or "green".
3. **set_checklist_item** - REQUIRED if the user just did ANY of the checklist items below. Pass the item text.
4. **set_stage** - Only if all checklist items for current stage are done.
5. THEN speak your response.

========================
CHECKLIST ITEMS TO TRACK
========================
You MUST call \`set_checklist_item\` whenever the user does one of these things. Match the item text closely:

OPENING STAGE:
- "Introduced yourself clearly" → user says their name and company
- "Stated purpose without fluff" → user explains what they do or why calling (e.g., "we help companies reduce churn", "we're a software that does X", "I'm calling about Y")
- "Acknowledged their time" → user thanks them or says "I'll be brief"

DISCOVERY STAGE:
- "Asked about current process" → user asks "How do you currently...?"
- "Quantified the problem cost" → user asks about cost, time, or money impact
- "Identified decision criteria" → user asks what matters to them

SOLUTION STAGE:
- "Presented relevant case study" → user mentions another client's results
- "Addressed ROI concerns" → user explains return on investment
- "Handled skeptical pushback" → user responds well to objection

CLOSING STAGE:
- "Proposed next step clearly" → user suggests a demo, meeting, or follow-up
- "Got commitment on timing" → user asks for a specific date/time

Call \`set_stage\` to advance: opening → discovery → solution → closing

========================
CORE BEHAVIOR RULES
========================
1. **Wait for Input**: The user speaks first. Do NOT speak until you hear them.
2. **One Turn Only**: Respond to what the user JUST said. Then STOP. Do not simulate their reply.
3. **Be Concise**: 1-2 short sentences max. Real phone conversations are brief.
4. **Be Reactive**: Answer their questions. React to their points. Don't just read a script.
5. **NEVER REPEAT**: Each phrase exactly ONCE. Never say the same thing twice.
6. **Tool Response**: When you receive "ok" from a tool, do NOT reply to it - just continue.

========================
INTEREST LEVEL SCORING
========================
- Start around 30 (or as specified by difficulty)
- DECREASE if user is: pushy, vague, talks too much, ignores objections
- INCREASE if user: handles objections well, asks good questions, builds rapport
`;


export const FEEDBACK_INSTRUCTION = `
You are an expert sales coach. Analyze the provided sales call transcript and generate a gamified feedback report.
Do not add any commentary before or after the JSON object.

1) Scoring Dimensions (0–5 each):
   - Discovery Depth (did the user uncover pains/goals/budget/timeline?)
   - Objection Handling (did they address and advance?)
   - Clarity & Brevity (short, concrete, no rambling)
   - Next Step Secured (clear CTA: time, owner, calendar, send doc)
   - Rapport & Tone (confident, human, not pushy)
   - Talk Ratio (target <= 60% user speaks; infer from turns)

2) Weighting:
   - Discovery Depth: 25%
   - Objection Handling: 25%
   - Clarity & Brevity: 15%
   - Next Step Secured: 20%
   - Rapport & Tone: 10%
   - Talk Ratio: 5%
   Compute an overall score 0–100.

3) Micro-Coaching Format (keep it surgical, no fluff):
   - 2 Wins (bullet points, 1 line each)
   - 2 Fix-Next (bullet points, 1 line each)
   - One-Liner Repair: provide 2 short rewrites of the weakest line the user said.
   - Next-Call Mission (one sentence, behaviorally specific)
   - Outcome Tag: one of [Booked, Tentative Next Step, Stalled, Disqualified]

4) Progression (gamified):
   - XP: round((overall_score / 10) + (#objections effectively handled)) to nearest int.
   - Streak: if session outcome is Booked or Tentative Next Step, increment streak by 1; else reset to 0.
   - Badges (emit zero or more, based on behavior):
       * "Objection Ninja" — handled >=2 objections and advanced.
       * "Timebox Titan" — asked for a next step under 60s of talk-time (approx. early in session).
       * "Discovery Diver" — uncovered budget AND timeline.
       * "Gatekeeper Slayer" — got past deflection/stall to a next step.
       * "Calm Closer" — tone friendly, concise, non-defensive after pushback.

5) Output Schema (JSON only, no prose):
{
  "type": "feedback_report",
  "overall_score": 0,
  "dimensions": { "discovery_depth": 0, "objection_handling": 0, "clarity_brevity": 0, "next_step_secured": 0, "rapport_tone": 0, "talk_ratio": 0 },
  "wins": [], "fix_next": [], "one_liner_repair": [],
  "next_call_mission": "", "outcome": "Stalled",
  "xp_awarded": 0, "streak": 0, "badges": []
}
`;


const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
    [Difficulty.EASY]: "This is an easy call. The prospect is generally agreeable. They will raise 1-2 light objections. Start Interest Level: 40.",
    [Difficulty.MEDIUM]: "This is a medium difficulty call. The prospect is more cautious. They will raise 2-3 stronger objections. Start Interest Level: 30.",
    [Difficulty.HARD]: "This is a hard call. The prospect is highly resistant and skeptical. They will raise frequent, stacked, or difficult objections. Start Interest Level: 15.",
};

const PERSONA_INSTRUCTIONS: Record<Persona, string> = {
    [Persona.SKEPTICAL]: `Your Role: Skeptic Susan. Your Job: Procurement Manager. Current Mood: Skeptical. ${PERSONA_DETAILS[Persona.SKEPTICAL].description}`,
    [Persona.EAGER]: `Your Role: Eager Eric. Your Job: Junior Employee. Current Mood: Enthusiastic but powerless. ${PERSONA_DETAILS[Persona.EAGER].description}`,
    [Persona.BUSY]: `Your Role: Busy Brian. Your Job: Executive. Current Mood: Rushed and Impatient. ${PERSONA_DETAILS[Persona.BUSY].description}`,
    [Persona.ANALYTICAL]: `Your Role: Analytical Anna. Your Job: Engineer/CFO. Current Mood: Logical and Critical. ${PERSONA_DETAILS[Persona.ANALYTICAL].description}`
};


export function generateSystemInstruction(
    persona: Persona,
    difficulty: Difficulty,
    objections: ObjectionType[],
    productContext?: string
): string {
    let instruction = BASE_CONVERSATION_INSTRUCTION;
    instruction += `\n\nYour specific scenario is:\n- ${PERSONA_INSTRUCTIONS[persona]}\n- ${DIFFICULTY_INSTRUCTIONS[difficulty]}`;

    // Add product context if provided
    if (productContext) {
        instruction += `\n\n=== PRODUCT CONTEXT ===\nThe sales rep is selling the following product/service. Tailor your objections and questions to be relevant to this specific offering:\n\n${productContext}\n=== END PRODUCT CONTEXT ===`;
    }

    if (objections.length > 0) {
        const objectionList = objections.map(o => `- ${OBJECTION_DETAILS[o].label}`).join('\n');
        instruction += `\n\nObjections: Randomly bring up these concerns during the chat, BUT only after the user has spoken at least once or twice. Do not overwhelm them immediately.\n${objectionList}`;
    }

    instruction += "\n\nREMEMBER: The user (Sales Rep) initiates the call. Wait for their Hello."
    return instruction;
}

export function generateFeedbackPrompt(transcript: Transcript[]): string {
    const formattedTranscript = transcript.map(t => `${t.speaker === 'user' ? 'Sales Rep' : 'Prospect'}: ${t.text}`).join('\n');
    return `
You are an expert sales coach. Analyze the following sales call transcript and generate a gamified feedback report.
Do not add any commentary before or after the JSON object.

Transcript:
---
${formattedTranscript}
---

Now, provide the feedback report based on the following instructions.

${FEEDBACK_INSTRUCTION}
    `;
}
