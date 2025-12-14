// server.js - WebSocket Proxy Server for Gemini Live API
import 'dotenv/config'; // Load .env file automatically
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';

// ============ RATE LIMITING & COST PROTECTION ============
const SESSION_MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes max per session
const SESSION_WARNING_MS = 8 * 60 * 1000; // Warn at 8 minutes
const MAX_SESSIONS_PER_IP_PER_HOUR = 5;
const MAX_DAILY_SESSIONS = 200; // Global daily cap (~$5-10/day safety valve)

// Track sessions for rate limiting
const ipSessionCounts = new Map(); // IP -> { count, resetTime }
let dailySessionCount = 0;
let dailyResetTime = Date.now() + 24 * 60 * 60 * 1000;

function resetDailyCountIfNeeded() {
    if (Date.now() > dailyResetTime) {
        dailySessionCount = 0;
        dailyResetTime = Date.now() + 24 * 60 * 60 * 1000;
        console.log('Daily session count reset');
    }
}

function canStartSession(ip) {
    resetDailyCountIfNeeded();

    // Check global daily limit
    if (dailySessionCount >= MAX_DAILY_SESSIONS) {
        return { allowed: false, reason: 'Daily session limit reached. Please try again tomorrow.' };
    }

    // Check per-IP limit
    const now = Date.now();
    const ipData = ipSessionCounts.get(ip) || { count: 0, resetTime: now + 60 * 60 * 1000 };

    if (now > ipData.resetTime) {
        ipData.count = 0;
        ipData.resetTime = now + 60 * 60 * 1000;
    }

    if (ipData.count >= MAX_SESSIONS_PER_IP_PER_HOUR) {
        return { allowed: false, reason: 'Too many sessions. Please wait an hour before starting a new session.' };
    }

    return { allowed: true };
}

function recordSession(ip) {
    resetDailyCountIfNeeded();
    dailySessionCount++;

    const now = Date.now();
    const ipData = ipSessionCounts.get(ip) || { count: 0, resetTime: now + 60 * 60 * 1000 };
    ipData.count++;
    ipSessionCounts.set(ip, ipData);

    console.log(`Session started: IP=${ip}, IP sessions=${ipData.count}/${MAX_SESSIONS_PER_IP_PER_HOUR}, Daily=${dailySessionCount}/${MAX_DAILY_SESSIONS}`);
}
// ============ END RATE LIMITING ============

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;

// Persona voice mapping (must match frontend)
const PERSONA_VOICES = {
    'Skeptic Susan': 'Kore',
    'Eager Eric': 'Puck',
    'Busy Brian': 'Fenrir',
    'Analytical Anna': 'Zephyr',
};

// Tool definitions for interest level, coaching tips, stage progression, and sentiment
const tools = [
    {
        functionDeclarations: [
            {
                name: "set_interest_level",
                description: "Updates the interest level of the prospect based on the conversation.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        level: {
                            type: "INTEGER",
                            description: "The new interest level (0-100)."
                        }
                    },
                    required: ["level"]
                }
            },
            {
                name: "set_coaching_tip",
                description: "Provides a coaching tip for the sales rep on what they should say next. Call this BEFORE speaking your response.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tip: {
                            type: "STRING",
                            description: "The exact words the sales rep should say in response. Keep it short and actionable."
                        }
                    },
                    required: ["tip"]
                }
            },
            {
                name: "set_stage",
                description: "Advances the sales call to the next stage when the user has completed the current stage's goals. Stages: opening → discovery → solution → closing.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        stage: {
                            type: "STRING",
                            enum: ["opening", "discovery", "solution", "closing"],
                            description: "The new stage to advance to."
                        }
                    },
                    required: ["stage"]
                }
            },
            {
                name: "set_sentiment",
                description: "Sets the sentiment of the prospect's reaction to the user's last input. Call this every turn.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        sentiment: {
                            type: "STRING",
                            enum: ["red", "orange", "green"],
                            description: "red = resistance/annoyance, orange = neutral/curiosity, green = agreement/excitement"
                        }
                    },
                    required: ["sentiment"]
                }
            },
            {
                name: "set_checklist_item",
                description: "Marks a checklist item as completed when the sales rep covers that topic. Pass the item text.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        item_text: {
                            type: "STRING",
                            description: "The text of the checklist item the user completed (e.g., 'Asked about current process')."
                        }
                    },
                    required: ["item_text"]
                }
            }
        ]
    }
];

// Get API key - from env (Cloud Run secret mount) or Secret Manager
async function getApiKey() {
    // First, check if already set as environment variable (Cloud Run secret)
    if (process.env.GEMINI_API_KEY) {
        const key = process.env.GEMINI_API_KEY;
        console.log(`Using API key from environment variable (${key.substring(0, 4)}...${key.substring(key.length - 4)})`);
        return key;
    }

    // Fallback: fetch from Secret Manager directly
    try {
        const client = new SecretManagerServiceClient();
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;

        if (!projectId) {
            throw new Error('PROJECT_ID not set');
        }

        const secretName = `projects/${projectId}/secrets/gemini-api-voice-agent/versions/latest`;
        const [version] = await client.accessSecretVersion({ name: secretName });
        const apiKey = version.payload?.data?.toString();

        if (!apiKey) {
            throw new Error('Secret payload is empty');
        }

        console.log('Fetched API key from Secret Manager');
        return apiKey;
    } catch (error) {
        console.error('Failed to get API key:', error);
        throw new Error('Could not retrieve API key. Ensure GEMINI_API_KEY env var is set or Secret Manager is configured.');
    }
}

// Create Express app
const app = express();
app.use(express.json());

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per IP
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve static files from dist/
app.use(express.static(join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Feedback generation endpoint (non-streaming, simpler as REST)
app.post('/api/feedback', apiLimiter, async (req, res) => {
    try {
        const { transcript, prompt } = req.body;

        if (!transcript || !prompt) {
            return res.status(400).json({ error: 'transcript and prompt are required' });
        }

        const apiKey = await getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        if (!response.text) {
            throw new Error('No response text from AI');
        }

        const report = JSON.parse(response.text);
        res.json(report);
    } catch (error) {
        console.error('Feedback generation error:', error);
        res.status(500).json({ error: 'Failed to generate feedback' });
    }
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server for Gemini Live proxy
const wss = new WebSocketServer({ server, path: '/ws/gemini' });

wss.on('connection', async (clientWs, req) => {
    // Get client IP for rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    console.log(`Client connected to WebSocket proxy from IP: ${clientIp}`);

    let geminiSession = null;
    let isClosing = false;
    let sessionTimer = null;
    let warningTimer = null;

    // Cleanup function for timers
    const cleanupTimers = () => {
        if (sessionTimer) clearTimeout(sessionTimer);
        if (warningTimer) clearTimeout(warningTimer);
        sessionTimer = null;
        warningTimer = null;
    };

    clientWs.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());

            // Handle session initialization
            if (message.type === 'init') {
                // Check rate limits before starting session
                const { allowed, reason } = canStartSession(clientIp);
                if (!allowed) {
                    console.log(`Session blocked for IP ${clientIp}: ${reason}`);
                    clientWs.send(JSON.stringify({ type: 'error', message: reason }));
                    clientWs.close();
                    return;
                }

                // Record this session
                recordSession(clientIp);

                console.log('Initializing Gemini session with config:', message.config);

                const apiKey = await getApiKey();
                const ai = new GoogleGenAI({ apiKey });

                const { persona, systemInstruction } = message.config;
                const voiceName = PERSONA_VOICES[persona] || 'Kore';

                // Connect to Gemini Live API
                geminiSession = await ai.live.connect({
                    model: 'gemini-2.0-flash-exp',
                    callbacks: {
                        onopen: () => {
                            console.log('Gemini session opened');
                            clientWs.send(JSON.stringify({ type: 'session_open' }));

                            // Start session duration timers
                            warningTimer = setTimeout(() => {
                                if (clientWs.readyState === WebSocket.OPEN) {
                                    console.log(`Session warning sent to IP ${clientIp}`);
                                    clientWs.send(JSON.stringify({
                                        type: 'session_warning',
                                        message: 'Your session will end in 2 minutes due to time limit.'
                                    }));
                                }
                            }, SESSION_WARNING_MS);

                            sessionTimer = setTimeout(() => {
                                console.log(`Session timeout for IP ${clientIp} - auto-disconnecting`);
                                if (clientWs.readyState === WebSocket.OPEN) {
                                    clientWs.send(JSON.stringify({
                                        type: 'session_timeout',
                                        message: 'Session ended due to 10-minute time limit. Start a new session to continue.'
                                    }));
                                }
                                isClosing = true;
                                cleanupTimers();
                                if (geminiSession) {
                                    geminiSession.close();
                                    geminiSession = null;
                                }
                                clientWs.close();
                            }, SESSION_MAX_DURATION_MS);
                        },
                        onmessage: async (geminiMessage) => {
                            // Forward Gemini messages to client
                            if (clientWs.readyState === WebSocket.OPEN) {
                                clientWs.send(JSON.stringify({
                                    type: 'gemini_message',
                                    data: geminiMessage
                                }));
                            }
                        },
                        onerror: (error) => {
                            console.error('Gemini session error:', error);
                            if (clientWs.readyState === WebSocket.OPEN) {
                                clientWs.send(JSON.stringify({
                                    type: 'error',
                                    message: error.message || 'Gemini session error'
                                }));
                            }
                        },
                        onclose: (event) => {
                            console.log('Gemini session closed:', event.reason);
                            if (clientWs.readyState === WebSocket.OPEN && !isClosing) {
                                clientWs.send(JSON.stringify({
                                    type: 'session_close',
                                    code: event.code,
                                    reason: event.reason
                                }));
                            }
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                        },
                        systemInstruction: systemInstruction,
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        tools: tools,
                    },
                });

                return;
            }

            // Handle audio input
            if (message.type === 'audio' && geminiSession) {
                geminiSession.sendRealtimeInput({
                    media: {
                        data: message.data,
                        mimeType: message.mimeType
                    }
                });
                return;
            }

            // Handle tool response
            if (message.type === 'tool_response' && geminiSession) {
                geminiSession.sendToolResponse(message.payload);
                return;
            }

            // Handle close request
            if (message.type === 'close') {
                isClosing = true;
                cleanupTimers();
                if (geminiSession) {
                    geminiSession.close();
                    geminiSession = null;
                }
                return;
            }

        } catch (error) {
            console.error('Error processing message:', error);
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                    type: 'error',
                    message: error.message || 'Error processing message'
                }));
            }
        }
    });

    clientWs.on('close', () => {
        console.log('Client disconnected');
        isClosing = true;
        cleanupTimers();
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
    });

    clientWs.on('error', (error) => {
        console.error('Client WebSocket error:', error);
        isClosing = true;
        if (geminiSession) {
            geminiSession.close();
            geminiSession = null;
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket proxy available at ws://localhost:${PORT}/ws/gemini`);
    console.log(`GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY ? 'Yes (' + process.env.GEMINI_API_KEY.substring(0, 4) + '...)' : 'NO!'}`);
});
