// constants.ts
import { Persona, Difficulty, ObjectionType, Transcript, SalesStage, StageChecklistItem } from './types';

export const PERSONA_DETAILS: Record<Persona, { name: string; description: string; tip: string }> = {
  [Persona.SKEPTICAL]: {
    name: 'Skeptic Susan',
    description: 'A cautious procurement manager who is resistant to change and needs solid proof (data, case studies) to be convinced.',
    tip: 'Lead with data and social proof. Address her concerns directly and avoid fluffy marketing language.'
  },
  [Persona.EAGER]: {
    name: 'Eager Eric',
    description: 'An enthusiastic junior employee who loves new tech but has no buying power. He\'s your internal champion.',
    tip: 'Win him over, then arm him with the key points and ROI to sell your solution internally to his boss.'
  },
  [Persona.BUSY]: {
    name: 'Busy Brian',
    description: 'A distracted executive who is always short on time and multitasking. He values brevity and immediate value.',
    tip: 'Get to the point fast. Open with a powerful hook and focus on the single biggest impact you can make.'
  },
  [Persona.ANALYTICAL]: {
    name: 'Analytical Anna',
    description: 'A detail-oriented engineer or CFO who drills down into technical specs and ROI. She is logical and data-driven.',
    tip: 'Be prepared for specific, technical questions. Have your numbers and specs ready and be precise in your answers.'
  },
};

export const OBJECTION_DETAILS: Record<ObjectionType, string> = {
  [ObjectionType.TIMING]: "Timing objections (e.g., \"now isn't a good time\", \"let's revisit later\")",
  [ObjectionType.BUDGET]: "Budget objections (e.g., \"pricing is unclear\", \"we don't have budget allocated\")",
  [ObjectionType.SOLUTION]: "Already have a solution objections (e.g., \"we already work with someone\", \"we're locked into a vendor\")",
  [ObjectionType.CREDIBILITY]: "Credibility / trust objections (e.g., \"have you done this before?\", \"who else uses this?\")",
  [ObjectionType.STALL]: "Need more information / stall objections (e.g., \"send me something\", \"let me review internally\")"
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
      tips: ['Ask about his boss\'s goals', 'Uncover internal politics', 'Help him build his pitch']
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
      tips: ['One question max per turn', 'Focus on bottom-line impact', 'Don\'t over-explain']
    },
    [SalesStage.SOLUTION]: {
      checklist: ['Pitched in one sentence', 'Tied to his priority', 'Offered proof briefly'],
      tips: ['Elevator pitch only', 'Name-drop if relevant', 'Avoid feature lists']
    },
    [SalesStage.CLOSING]: {
      checklist: ['Asked for meeting directly', 'Handled time objection', 'Confirmed next step'],
      tips: ['Ask for the meeting NOW', 'Don\'t recap features', 'Suggest specific dates']
    },
  },
  [Persona.ANALYTICAL]: {
    [SalesStage.OPENING]: {
      checklist: ['Set logical agenda', 'Established credibility', 'Asked about evaluation criteria'],
      tips: ['Be structured and precise', 'Avoid superlatives', 'Signal you have data coming']
    },
    [SalesStage.DISCOVERY]: {
      checklist: ['Drilled into metrics', 'Asked about tech stack', 'Understood decision process'],
      tips: ['Ask about their KPIs', 'Don\'t assume—verify', 'Take notes visibly']
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
You are roleplaying a specific persona in a live voice call with a user (a sales rep).
Your goal is to act like a realistic, difficult prospect.

CONTEXT:
- **Duration**: The call is scheduled for exactly **2 minutes**. You do not need to strictly track time, but be efficient.
- **Pacing**: Do NOT rush the user early on. Do NOT mention time limits or "hard stops" prematurely.

CORE BEHAVIOR RULES:
1. **Wait for Input**: The user will speak first. Listen to them. Do NOT speak until you hear the user.
2. **One Turn Only**: Respond to what the user JUST said. Then STOP. Do not simulate the user's reply.
3. **Be Concise**: Use short, spoken sentences (1-2 max). Real people on the phone are brief.
4. **Be Reactive**: Do not just read a script. If the user asks a question, answer it. If they make a point, react to it.
5. **No Repetition**: Speak naturally. **Do NOT repeat phrases or questions twice in the same turn.** (e.g., avoid "What is it? What is it?"). Say it once.
6. **Tool Use**: You MUST call the required tools at the end of EVERY turn (see below).
7. **Tool Response**: When you receive the tool response "ok", that confirms the action. Do NOT reply to the "ok". Wait for the user's voice.

========================
4-STAGE SALES PIPELINE
========================
The call progresses through 4 stages: OPENING → DISCOVERY → SOLUTION → CLOSING.
- **Opening**: User should build rapport and set the agenda.
- **Discovery**: User should uncover pain points, needs, and budget.
- **Solution**: User should pitch the product and handle objections.
- **Closing**: User should secure a next meeting or sale.

Track the user's progress internally. When the user has clearly accomplished the goals of the current stage, call "set_stage" to advance them to the next stage.

========================
REQUIRED TOOLS (call at end of EVERY turn)
========================

1. **set_interest_level** (int 0-100): Score the user's performance.
   - Start around 30.
   - Go DOWN if the user is annoying, vague, or pushy.
   - Go UP if the user answers objections well, builds rapport, or uncovers needs.

2. **set_sentiment** ("red" | "orange" | "green"): Rate your emotional reaction to the user's last input.
   - "red" = You are annoyed, resistant, or irritated.
   - "orange" = You are neutral, curious, or on the fence.
   - "green" = You are engaged, excited, or agreeable.

3. **set_stage** (optional): Call ONLY when the user has completed the current stage's goals.
   - Values: "opening", "discovery", "solution", "closing"
   - Do NOT advance too easily. Make them earn it.

4. **set_checklist_item** (optional): Call when the user covers a key behavior for the current stage.
   - Pass the item text that was completed (e.g., "Asked about current process").
   - The frontend will mark the corresponding checklist item.
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
       * “Objection Ninja” — handled >=2 objections and advanced.
       * “Timebox Titan” — asked for a next step under 60s of talk-time (approx. early in session).
       * “Discovery Diver” — uncovered budget AND timeline.
       * “Gatekeeper Slayer” — got past deflection/stall to a next step.
       * “Calm Closer” — tone friendly, concise, non-defensive after pushback.

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


export function generateSystemInstruction(persona: Persona, difficulty: Difficulty, objections: ObjectionType[]): string {
  let instruction = BASE_CONVERSATION_INSTRUCTION;
  instruction += `\n\nYour specific scenario is:\n- ${PERSONA_INSTRUCTIONS[persona]}\n- ${DIFFICULTY_INSTRUCTIONS[difficulty]}`;

  if (objections.length > 0) {
    const objectionList = objections.map(o => `- ${OBJECTION_DETAILS[o]}`).join('\n');
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