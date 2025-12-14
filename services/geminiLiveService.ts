// services/geminiLiveService.ts

// FIX: Removed non-exported 'LiveSession' type from import.
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type, Tool } from "@google/genai";
import { generateSystemInstruction, generateFeedbackPrompt } from '../constants';
import { Persona, Difficulty, ObjectionType, Transcript, FeedbackReport } from '../types';

const PERSONA_VOICES: Record<Persona, string> = {
    [Persona.SKEPTICAL]: 'Kore',       // Susan (female)
    [Persona.EAGER]: 'Puck',           // Eric (male)
    [Persona.BUSY]: 'Fenrir',          // Brian (male)
    [Persona.ANALYTICAL]: 'Zephyr',    // Anna (female)
};


// Audio Encoding/Decoding Functions
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export function createPcmBlob(data: Float32Array, sampleRate: number): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: `audio/pcm;rate=${sampleRate}`,
    };
}

// Session Management
interface SessionCallbacks {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => Promise<void>;
    onError: (e: ErrorEvent) => void;
    onClose: (e: CloseEvent) => void;
}

// Define the tool for interest level
const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "set_interest_level",
                description: "Updates the interest level of the prospect based on the conversation.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        level: {
                            type: Type.INTEGER,
                            description: "The new interest level (0-100)."
                        }
                    },
                    required: ["level"]
                }
            }
        ]
    }
];

// FIX: Removed return type to be inferred, as 'LiveSession' is not an exported type.
export function startSession(
    persona: Persona,
    difficulty: Difficulty,
    selectedObjections: ObjectionType[],
    callbacks: SessionCallbacks
) {

    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = generateSystemInstruction(persona, difficulty, selectedObjections);
    const voiceName = PERSONA_VOICES[persona];

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
            },
            systemInstruction: systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: tools,
        },
    });

    return sessionPromise;
}

// New function for generating feedback report
export async function generateFeedback(transcript: Transcript[]): Promise<FeedbackReport> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = generateFeedbackPrompt(transcript);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        // FIX: Enforce JSON output for more reliable parsing.
        config: {
            responseMimeType: "application/json",
        },
    });

    try {
        // With responseMimeType set to JSON, we can directly parse the text.
        if (!response.text) {
            throw new Error("AI response did not contain any text content.");
        }
        const report = JSON.parse(response.text);
        return report as FeedbackReport;
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", response.text, e);
        throw new Error("Invalid JSON format in feedback report.");
    }
}