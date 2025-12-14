// services/geminiLiveService.ts
// WebSocket Proxy Client - connects to our server instead of Gemini directly

import { generateSystemInstruction, generateFeedbackPrompt } from '../constants';
import { Persona, Difficulty, ObjectionType, Transcript, FeedbackReport } from '../types';

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

export interface Blob {
    data: string;
    mimeType: string;
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

// Proxy Session Interface
export interface ProxySession {
    sendRealtimeInput: (input: { media: Blob }) => void;
    sendToolResponse: (response: { functionResponses: Array<{ id: string; name: string; response: { result: string } }> }) => void;
    close: () => void;
}

// Session Callbacks (matches original interface for compatibility)
interface SessionCallbacks {
    onOpen: () => void;
    onMessage: (message: any) => Promise<void>;
    onError: (e: ErrorEvent | Event) => void;
    onClose: (e: CloseEvent | Event) => void;
}

export function startSession(
    persona: Persona,
    difficulty: Difficulty,
    selectedObjections: ObjectionType[],
    callbacks: SessionCallbacks,
    productContext?: string
): Promise<ProxySession> {
    return new Promise((resolve, reject) => {
        // Connect to our proxy WebSocket instead of Gemini directly
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/gemini`;

        console.log('Connecting to proxy:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to proxy WebSocket');

            // Generate system instruction on client side (same as before)
            const systemInstruction = generateSystemInstruction(persona, difficulty, selectedObjections, productContext);

            // Send initialization message to proxy
            ws.send(JSON.stringify({
                type: 'init',
                config: {
                    persona: persona,
                    systemInstruction: systemInstruction,
                }
            }));
        };

        ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);

                switch (message.type) {
                    case 'session_open':
                        // Gemini session is ready
                        callbacks.onOpen();

                        // Create the session interface
                        const session: ProxySession = {
                            sendRealtimeInput: (input) => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: 'audio',
                                        data: input.media.data,
                                        mimeType: input.media.mimeType
                                    }));
                                }
                            },
                            sendToolResponse: (response) => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: 'tool_response',
                                        payload: response
                                    }));
                                }
                            },
                            close: () => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'close' }));
                                    ws.close();
                                }
                            }
                        };

                        resolve(session);
                        break;

                    case 'gemini_message':
                        // Forward Gemini message to callback
                        await callbacks.onMessage(message.data);
                        break;

                    case 'session_close':
                        callbacks.onClose(new CloseEvent('close', {
                            code: message.code,
                            reason: message.reason
                        }));
                        break;

                    case 'error':
                        console.error('Proxy error:', message.message);
                        callbacks.onError(new ErrorEvent('error', {
                            message: message.message
                        }));
                        break;
                }
            } catch (error) {
                console.error('Error parsing proxy message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            callbacks.onError(error);
            reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            callbacks.onClose(event);
        };
    });
}

// Feedback generation - now uses REST API instead of direct Gemini call
export async function generateFeedback(transcript: Transcript[]): Promise<FeedbackReport> {
    const prompt = generateFeedbackPrompt(transcript);

    const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transcript,
            prompt
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to generate feedback');
    }

    const report = await response.json();
    return report as FeedbackReport;
}
