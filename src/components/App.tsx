import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Persona,
    Difficulty,
    ObjectionType,
    Transcript,
    FeedbackReport,
    SalesStage,
    Sentiment,
    StageChecklistItem,
} from '../types';
import {
    PERSONA_DETAILS,
    PERSONA_COLORS,
    OBJECTION_DETAILS,
    OBJECTION_BUTTON_LABELS,
    PERSONA_OBJECTIONS,
    PERSONA_STAGE_MATRIX,
    STAGE_CONFIG,
} from '../constants';
import { startSession, decode, decodeAudioData, createPcmBlob, generateFeedback, ProxySession } from '../services/geminiLiveService';
import { TranscriptBubble } from './TranscriptBubble';
import { Icon } from './Icon';
import { MicCheck } from './MicCheck';
import { ProductUpload } from './ProductUpload';
import { RankBadge } from './RankBadge';
import { StageProgressBar } from './StageProgressBar';
import { DynamicBattleCard } from './DynamicBattleCard';

// Dimension display config with icons and formatted labels
const DIMENSION_DISPLAY: Record<string, { icon: string; label: string }> = {
    discovery_depth: { icon: '🔍', label: 'Discovery Depth' },
    objection_handling: { icon: '🛡️', label: 'Objection Handling' },
    clarity_brevity: { icon: '✂️', label: 'Clarity & Brevity' },
    next_step_secured: { icon: '📅', label: 'Next Step Secured' },
    rapport_tone: { icon: '🤝', label: 'Rapport & Tone' },
    talk_ratio: { icon: '⚖️', label: 'Talk Ratio' },
};

const CALL_DURATION_SECONDS = 120; // 2 minutes

// Message type from proxy (matches server.js format)
interface ProxyMessage {
    serverContent?: {
        modelTurn?: {
            parts?: Array<{ inlineData?: { data: string } }>;
        };
        inputTranscription?: { text: string };
        outputTranscription?: { text: string };
        interrupted?: boolean;
        turnComplete?: boolean;
    };
    toolCall?: {
        functionCalls: Array<{
            id: string;
            name: string;
            args: { level?: number; tip?: string }; // Supports both tools
        }>;
    };
}

export default function App() {
    // --- State ---
    const [persona, setPersona] = useState<Persona>(Persona.SKEPTICAL);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
    const [selectedObjections, setSelectedObjections] = useState<ObjectionType[]>([]);
    const [productContext, setProductContext] = useState<string>('');

    // Session & Timer
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(CALL_DURATION_SECONDS);
    const [statusText, setStatusText] = useState('Configure your session and start the call.');
    const [error, setError] = useState<string | null>(null);

    // Audio & Visuals
    const [volume, setVolume] = useState(0);
    const [interestLevel, setInterestLevel] = useState(50);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    // Data
    const [liveInputTranscript, setLiveInputTranscript] = useState('');
    const [liveOutputTranscript, setLiveOutputTranscript] = useState('');
    const [transcriptVersion, setTranscriptVersion] = useState(0);
    const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [expandedFixes, setExpandedFixes] = useState<Set<number>>(new Set());

    // Stage Pipeline & Sentiment (Dynamic Coach)
    const [currentStage, setCurrentStage] = useState<SalesStage>(SalesStage.OPENING);
    const [checklistItems, setChecklistItems] = useState<StageChecklistItem[]>([]);
    const [currentSentiment, setCurrentSentiment] = useState<Sentiment>('orange');

    // --- Refs ---
    const sessionRef = useRef<ProxySession | null>(null);
    const sessionPromiseRef = useRef<Promise<ProxySession> | null>(null);
    const transcriptHistoryRef = useRef<Transcript[]>([]);
    const liveInputTranscriptRef = useRef('');
    const liveOutputTranscriptRef = useRef('');
    const isAiTurnRef = useRef(false);
    const isAwaitingFinalMessageRef = useRef(false);
    const forceStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const nextAudioStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // --- Effects ---

    // Timer
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        if (isSessionActive) {
            intervalId = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (intervalId) clearInterval(intervalId);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isSessionActive]);

    // Hard Stop at 0
    useEffect(() => {
        if (!isSessionActive) return;

        if (timeLeft === 0 && !isAwaitingFinalMessageRef.current) {
            console.log("Time up. Stopping.");
            setStatusText("Time's up!");
            isAwaitingFinalMessageRef.current = true;

            if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();

            // Give it a moment for the final audio to play out or feedback to generate
            forceStopTimeoutRef.current = setTimeout(() => {
                handleStopSession();
            }, 3000);
        }
    }, [timeLeft, isSessionActive]);

    // Volume Visualizer
    useEffect(() => {
        let frameId: number;
        const updateVolume = () => {
            if (analyserRef.current && isSessionActive) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setVolume(Math.min(1, avg / 50));
            } else {
                setVolume(0);
            }
            frameId = requestAnimationFrame(updateVolume);
        };
        updateVolume();
        return () => cancelAnimationFrame(frameId);
    }, [isSessionActive]);

    // Scroll to bottom
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptVersion, liveInputTranscript, liveOutputTranscript]);


    // --- Handlers ---

    const cleanText = (text: string) => {
        return text.replace(/\[.*?\]/g, '').trim();
    };

    const addMessageToHistory = (message: Omit<Transcript, 'id'>) => {
        const cleanedText = cleanText(message.text);
        if (!cleanedText) return; // Don't add empty messages (e.g. only system tags)

        transcriptHistoryRef.current.push({ ...message, text: cleanedText, id: `${message.speaker}-${Date.now()}` });
        setTranscriptVersion(v => v + 1);
    };

    const handleObjectionToggle = (obj: ObjectionType) => {
        setSelectedObjections(prev =>
            prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
        );
    };

    const onMessage = useCallback(async (message: ProxyMessage) => {
        // 1. Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            setIsAiSpeaking(true);
            const ctx = outputAudioContextRef.current;
            nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsAiSpeaking(false);
            });
            source.start(nextAudioStartTimeRef.current);
            nextAudioStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }

        // 2. Handle Tool Calls (e.g. set_interest_level)
        if (message.toolCall?.functionCalls) {
            for (const fc of message.toolCall.functionCalls) {
                // Handle interest level
                if (fc.name === 'set_interest_level') {
                    const args = fc.args as { level: number };
                    if (typeof args.level === 'number') {
                        setInterestLevel(args.level);
                    }
                    if (sessionRef.current) {
                        sessionRef.current.sendToolResponse({
                            functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }]
                        });
                    }
                }

                // Handle set_stage (Dynamic Coach)
                if (fc.name === 'set_stage') {
                    const args = fc.args as { stage: string };
                    const stageMap: Record<string, SalesStage> = {
                        'opening': SalesStage.OPENING,
                        'discovery': SalesStage.DISCOVERY,
                        'solution': SalesStage.SOLUTION,
                        'closing': SalesStage.CLOSING,
                    };
                    if (args.stage && stageMap[args.stage]) {
                        setCurrentStage(stageMap[args.stage]);
                        // Re-initialize checklist for the new stage
                        const stageData = PERSONA_STAGE_MATRIX[persona][stageMap[args.stage]];
                        if (stageData) {
                            setChecklistItems(stageData.checklist.map((label, idx) => ({
                                id: `${args.stage}-${idx}`,
                                label,
                                completed: false,
                            })));
                        }
                    }
                    if (sessionRef.current) {
                        sessionRef.current.sendToolResponse({
                            functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }]
                        });
                    }
                }

                // Handle set_sentiment (Dynamic Coach)
                if (fc.name === 'set_sentiment') {
                    const args = fc.args as { sentiment: string };
                    const validSentiments = ['red', 'orange', 'green'] as const;
                    if (args.sentiment && validSentiments.includes(args.sentiment as any)) {
                        setCurrentSentiment(args.sentiment as Sentiment);
                    }
                    if (sessionRef.current) {
                        sessionRef.current.sendToolResponse({
                            functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }]
                        });
                    }
                }

                // Handle set_checklist_item (Dynamic Coach) - matches by item text
                if (fc.name === 'set_checklist_item') {
                    const args = fc.args as { item_text: string; completed?: boolean };
                    console.log('[Checklist] Received set_checklist_item:', args);
                    if (args.item_text) {
                        setChecklistItems(prev => {
                            const updated = prev.map((item) =>
                                item.label.toLowerCase().includes(args.item_text.toLowerCase())
                                    ? { ...item, completed: args.completed ?? true }
                                    : item
                            );
                            console.log('[Checklist] Updated items:', updated.filter(i => i.completed).map(i => i.label));
                            return updated;
                        });
                    }
                    if (sessionRef.current) {
                        sessionRef.current.sendToolResponse({
                            functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }]
                        });
                    }
                }
            }
        }

        if (message.serverContent?.interrupted) {
            audioSourcesRef.current.forEach(s => s.stop());
            audioSourcesRef.current.clear();
            nextAudioStartTimeRef.current = 0;
            setIsAiSpeaking(false);
            isAiTurnRef.current = false;
        }

        // 3. Handle Text (Streaming)
        if (message.serverContent?.inputTranscription) {
            liveInputTranscriptRef.current += message.serverContent.inputTranscription.text;
            setLiveInputTranscript(cleanText(liveInputTranscriptRef.current));
        }

        if (message.serverContent?.outputTranscription) {
            liveOutputTranscriptRef.current += message.serverContent.outputTranscription.text;
            setLiveOutputTranscript(cleanText(liveOutputTranscriptRef.current));

            if (!isAiTurnRef.current) {
                if (liveInputTranscriptRef.current.trim()) {
                    const userText = liveInputTranscriptRef.current.trim();
                    addMessageToHistory({ speaker: 'user', text: userText });
                    liveInputTranscriptRef.current = '';
                    setLiveInputTranscript('');
                }
                isAiTurnRef.current = true;
            }
        }

        // 4. Turn Complete
        if (message.serverContent?.turnComplete) {
            isAiTurnRef.current = false;
            setIsAiSpeaking(false);

            if (liveOutputTranscriptRef.current.trim()) {
                const aiText = liveOutputTranscriptRef.current.trim();
                addMessageToHistory({ speaker: 'ai', text: aiText });
            }

            liveOutputTranscriptRef.current = '';
            setLiveOutputTranscript('');

            if (isAwaitingFinalMessageRef.current) {
                handleStopSession();
            }
        }
    }, []);

    const closeLiveSession = () => {
        sessionRef.current?.close();
        sessionRef.current = null;
        sessionPromiseRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        scriptProcessorRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        analyserRef.current = null;

        audioSourcesRef.current.forEach(s => s.stop());
        audioSourcesRef.current.clear();
        nextAudioStartTimeRef.current = 0;

        setIsSessionActive(false);
        setIsConnecting(false);
        setIsAiSpeaking(false);
    };

    const handleStopSession = async () => {
        if (forceStopTimeoutRef.current) clearTimeout(forceStopTimeoutRef.current);

        closeLiveSession();

        setError(null);
        setFeedbackReport(null);

        if (liveInputTranscriptRef.current.trim()) {
            addMessageToHistory({ speaker: 'user', text: liveInputTranscriptRef.current.trim() });
        }

        setLiveInputTranscript('');
        setLiveOutputTranscript('');
        liveInputTranscriptRef.current = '';
        liveOutputTranscriptRef.current = '';

        setStatusText('Analyzing call performance...');
        setIsGeneratingFeedback(true);

        try {
            // No API key needed - server handles it
            const report = await generateFeedback(transcriptHistoryRef.current);
            setFeedbackReport(report);
            setStatusText('Feedback generated.');
        } catch (e) {
            console.error(e);
            setError("Failed to generate feedback report.");
            setStatusText('Session ended.');
        } finally {
            setIsGeneratingFeedback(false);
            isAwaitingFinalMessageRef.current = false;
        }
    };

    const handleStartSession = async () => {
        if (isSessionActive || isConnecting) return;

        setFeedbackReport(null);
        setError(null);
        transcriptHistoryRef.current = [];
        setTranscriptVersion(0);
        setLiveInputTranscript('');
        setLiveOutputTranscript('');
        liveInputTranscriptRef.current = '';
        liveOutputTranscriptRef.current = '';
        isAwaitingFinalMessageRef.current = false;

        const startInterest = difficulty === Difficulty.HARD ? 15 : difficulty === Difficulty.MEDIUM ? 30 : 40;
        setInterestLevel(startInterest);

        // Initialize Dynamic Coach state
        setCurrentStage(SalesStage.OPENING);
        setCurrentSentiment('orange');
        const openingData = PERSONA_STAGE_MATRIX[persona][SalesStage.OPENING];
        setChecklistItems(openingData.checklist.map((label, idx) => ({
            id: `opening-${idx}`,
            label,
            completed: false,
        })));

        setIsConnecting(true);
        setTimeLeft(CALL_DURATION_SECONDS);
        setStatusText('Accessing microphone...');

        try {
            // Use default browser sample rate for better compatibility
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const analyser = inputAudioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            setStatusText('Connecting to AI...');

            // No API key needed - server handles it
            sessionPromiseRef.current = startSession(persona, difficulty, selectedObjections, {
                onOpen: () => {
                    setIsConnecting(false);
                    setIsSessionActive(true);
                    setStatusText('Call Active');

                    if (!inputAudioContextRef.current || !mediaStreamRef.current || !analyserRef.current) return;

                    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                    source.connect(analyserRef.current);
                    source.connect(processor);
                    processor.connect(inputAudioContextRef.current.destination);

                    scriptProcessorRef.current = processor;

                    const sampleRate = inputAudioContextRef.current.sampleRate;

                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const blob = createPcmBlob(inputData, sampleRate);
                        sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: blob }));
                    };
                },
                onMessage: onMessage,
                onError: (e) => {
                    console.error("Session Error", e);
                    const msg = (e as any).message || (e as any).toString() || "";
                    if (msg.includes("Requested entity was not found")) {
                        setError("Model access denied. Please check your API key configuration.");
                    } else {
                        setError("Connection error: " + msg);
                    }
                    closeLiveSession();
                },
                onClose: (e) => {
                    console.log("Session Closed", e);
                    if (!isAwaitingFinalMessageRef.current && !feedbackReport) {
                        handleStopSession();
                    }
                }
            }, productContext);

            sessionRef.current = await sessionPromiseRef.current;

        } catch (e: any) {
            console.error(e);
            const msg = e.message || e.toString() || "";
            if (msg.includes("Requested entity was not found")) {
                setError("Model access denied. Please check your API key configuration.");
            } else {
                setError("Failed to start session. " + (e.message || ""));
            }
            setIsConnecting(false);
        }
    };


    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const getInterestColor = (val: number) => {
        if (val < 30) return 'bg-red-500';
        if (val < 60) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans selection:bg-blue-500/30">

            <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Icon type="lightbulb" className="w-6 h-6 text-blue-400" />
                        <h1 className="font-bold text-lg tracking-tight">Sales<span className="text-blue-400">Trainer</span>.ai</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {isSessionActive && (
                            <div className={`px-3 py-1 rounded-full text-sm font-mono font-bold flex items-center gap-2 border ${timeLeft < 20 ? 'bg-red-900/30 border-red-500 text-red-400 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                                <div className={`w-2 h-2 rounded-full ${timeLeft < 20 ? 'bg-red-500' : 'bg-green-500'}`} />
                                {formatTime(timeLeft)}
                            </div>
                        )}

                        {(isSessionActive || isConnecting) && (
                            <button
                                onClick={handleStopSession}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                            >
                                End Call
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 md:p-6 pb-24">

                {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-200">
                        <Icon type="info" className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {!isSessionActive && !isConnecting && !feedbackReport && !isGeneratingFeedback && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-2 mb-10">
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Master Your Pitch
                            </h2>
                            <p className="text-gray-400 max-w-lg mx-auto">
                                Practice with AI personas that react realistically to your tone and content.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Step 1</span>
                                    <h3 className="font-semibold text-lg">Choose Prospect & Objections</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(PERSONA_DETAILS).map(([key, details]) => {
                                        const colors = PERSONA_COLORS[key as Persona];
                                        const isSelected = persona === key;
                                        return (
                                            <div key={key} className="space-y-2">
                                                <button
                                                    onClick={() => setPersona(key as Persona)}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                                        ? `${colors.bg} ${colors.border} ring-1 ${colors.ring}`
                                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800/80'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className={`font-bold ${isSelected ? colors.text : 'text-gray-200'}`}>{details.name}</div>
                                                        <span className={`text-xs ${isSelected ? colors.text : 'text-gray-500'}`}>
                                                            {isSelected ? '▼' : '▶'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-400 mt-1">{details.description}</div>
                                                </button>

                                                {/* Expandable Objections */}
                                                {isSelected && (
                                                    <div className="ml-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700 animate-in slide-in-from-top-2 duration-200">
                                                        <p className="text-xs text-orange-400 font-semibold mb-2">🎯 Select objections to practice:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(OBJECTION_DETAILS).map(([objKey, objection]) => {
                                                                const isObjSelected = selectedObjections.includes(objKey as ObjectionType);
                                                                return (
                                                                    <button
                                                                        key={objKey}
                                                                        onClick={() => handleObjectionToggle(objKey as ObjectionType)}
                                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isObjSelected
                                                                            ? 'bg-orange-500 text-white shadow-sm'
                                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                                                    >
                                                                        {objection.icon} {OBJECTION_BUTTON_LABELS[objKey as ObjectionType]}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Product Context Upload */}
                                <ProductUpload
                                    productContext={productContext}
                                    onProductContext={setProductContext}
                                />

                                {/* Difficulty Slider */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Step 2</span>
                                        <h3 className="font-semibold text-lg">Difficulty</h3>
                                    </div>
                                    <div className={`p-1 rounded-lg border transition-all duration-300 ${difficulty === Difficulty.EASY ? 'bg-green-900/30 border-green-500/50' :
                                        difficulty === Difficulty.MEDIUM ? 'bg-yellow-900/30 border-yellow-500/50' :
                                            'bg-red-900/30 border-red-500/50'
                                        }`}>
                                        <div className="flex">
                                            {Object.values(Difficulty).map((diff) => (
                                                <button
                                                    key={diff}
                                                    onClick={() => setDifficulty(diff)}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${difficulty === diff
                                                        ? diff === Difficulty.EASY ? 'bg-green-600 text-white shadow-sm' :
                                                            diff === Difficulty.MEDIUM ? 'bg-yellow-600 text-white shadow-sm' :
                                                                'bg-red-600 text-white shadow-sm'
                                                        : 'text-gray-400 hover:text-gray-200'
                                                        }`}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <p className={`text-xs text-center transition-all ${difficulty === Difficulty.EASY ? 'text-green-400' :
                                        difficulty === Difficulty.MEDIUM ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`}>
                                        {difficulty === Difficulty.EASY ? '😊 Prospect is friendly and agreeable' :
                                            difficulty === Difficulty.MEDIUM ? '🤔 Expect pushback and objections' :
                                                '⚠️ Warning: Low patience, high resistance'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mission Brief Card */}
                        <div className="mt-8 p-4 bg-gray-800/60 border border-gray-700 rounded-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">📋</span>
                                <h4 className="font-bold text-gray-200">Mission Brief</h4>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className={`px-3 py-1 rounded-full ${PERSONA_COLORS[persona].bg} ${PERSONA_COLORS[persona].border} border`}>
                                    <span className="text-gray-400">Target:</span> <span className={PERSONA_COLORS[persona].text}>{PERSONA_DETAILS[persona].name}</span>
                                </span>
                                <span className={`px-3 py-1 rounded-full border ${difficulty === Difficulty.EASY ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                                    difficulty === Difficulty.MEDIUM ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400' :
                                        'bg-red-900/30 border-red-500/50 text-red-400'
                                    }`}>
                                    <span className="text-gray-400">Difficulty:</span> {difficulty}
                                </span>
                                {selectedObjections.length > 0 && (
                                    <span className="px-3 py-1 rounded-full bg-orange-900/30 border border-orange-500/50 text-orange-400">
                                        <span className="text-gray-400">Focus:</span> {selectedObjections.map(o => OBJECTION_DETAILS[o].icon).join(' ')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Start Button with Mic Check */}
                        <div className="pt-8 flex justify-center items-center gap-4">
                            <MicCheck />
                            <button
                                onClick={handleStartSession}
                                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="flex items-center gap-2">
                                    Start Call Simulation
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {(isSessionActive || isConnecting) && (
                    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
                        {/* Stage Progress Bar (replaces old Deal Health) */}
                        <StageProgressBar
                            currentStage={currentStage}
                            interestLevel={interestLevel}
                            onStageOverride={(stage) => {
                                setCurrentStage(stage);
                                const stageData = PERSONA_STAGE_MATRIX[persona][stage];
                                if (stageData) {
                                    setChecklistItems(stageData.checklist.map((label, idx) => ({
                                        id: `${stage}-${idx}`,
                                        label,
                                        completed: false,
                                    })));
                                }
                            }}
                        />

                        {/* Main Content Grid - Mobile responsive */}
                        <div className="flex flex-col md:grid md:grid-cols-4 gap-4 flex-1 min-h-0">
                            {/* Dynamic Battle Card - Shows first on mobile */}
                            <div className="order-1 md:order-2 md:col-span-1 max-h-48 md:max-h-none overflow-y-auto">
                                <DynamicBattleCard
                                    persona={persona}
                                    currentStage={currentStage}
                                    checklistItems={checklistItems}
                                    difficulty={difficulty}
                                    isAiSpeaking={isAiSpeaking}
                                    volume={volume}
                                />
                            </div>

                            {/* Chat Area - 75% on desktop */}
                            <div className="order-2 md:order-1 md:col-span-3 bg-gray-800/50 border border-gray-700 rounded-2xl flex flex-col overflow-hidden flex-1">
                                <div className="p-3 border-b border-gray-700 bg-gray-800/80 flex items-center justify-between">
                                    <h3 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
                                        <Icon type="info" className="w-4 h-4" /> Live Call
                                    </h3>
                                    {isConnecting ? (
                                        <span className="text-xs text-yellow-400 animate-pulse">Connecting...</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs text-green-400">Live</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                                    {transcriptHistoryRef.current.map((t) => (
                                        <TranscriptBubble
                                            key={t.id}
                                            transcript={t}
                                            sentiment={t.speaker === 'ai' ? currentSentiment : undefined}
                                        />
                                    ))}

                                    {liveInputTranscript && (
                                        <TranscriptBubble
                                            transcript={{ id: 'live-user', speaker: 'user', text: liveInputTranscript }}
                                            isLive={true}
                                        />
                                    )}

                                    {liveOutputTranscript && (
                                        <TranscriptBubble
                                            transcript={{ id: 'live-ai', speaker: 'ai', text: liveOutputTranscript }}
                                            isLive={true}
                                            sentiment={currentSentiment}
                                        />
                                    )}

                                    <div ref={transcriptEndRef} />
                                </div>

                                {/* Mic Visualizer */}
                                <div className="p-3 border-t border-gray-700 bg-gray-800/80 flex items-center justify-center gap-3">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-blue-500 rounded transition-all duration-100"
                                                style={{ height: `${8 + (volume * 20 * (i % 2 === 0 ? 1 : 0.7))}px` }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">Listening...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(isGeneratingFeedback || feedbackReport) && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-3xl mx-auto">
                        {isGeneratingFeedback ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                                <h2 className="text-2xl font-bold">Analyzing your performance...</h2>
                                <p className="text-gray-400 mt-2">Our AI coach is reviewing the transcript.</p>
                            </div>
                        ) : feedbackReport && (
                            <div className="space-y-6">
                                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                                    <div className="flex flex-col items-center mb-4">
                                        <RankBadge score={feedbackReport.overall_score} size="lg" />
                                        <div className="text-center mt-2">
                                            <div className="text-5xl font-black text-white">{feedbackReport.overall_score}</div>
                                            <div className="text-sm text-gray-400">out of 100</div>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold mb-1">{feedbackReport.outcome}</h2>
                                    <p className="text-gray-400 mb-6">Performance Summary</p>

                                    <div className="flex justify-center gap-4 flex-wrap">
                                        {feedbackReport.badges.map(badge => (
                                            <span key={badge} className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Icon type="award" className="w-3 h-3" /> {badge}
                                            </span>
                                        ))}
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold">
                                            +{feedbackReport.xp_awarded} XP
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {Object.entries(feedbackReport.dimensions).map(([key, score]) => {
                                        const display = DIMENSION_DISPLAY[key] || { icon: '📊', label: key.replace(/_/g, ' ') };
                                        return (
                                            <div key={key} className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                        <span className="text-lg">{display.icon}</span>
                                                        {display.label}
                                                    </span>
                                                    <span className="text-sm font-bold">{score}/5</span>
                                                </div>
                                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${(score / 5) * 100}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-6">
                                        <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                                            <Icon type="award" className="w-5 h-5" /> What You Did Well
                                        </h3>
                                        <ul className="space-y-2">
                                            {feedbackReport.wins.map((win, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-gray-300">
                                                    <span className="text-green-500">✓</span> {win}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
                                        <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                                            <Icon type="lightbulb" className="w-5 h-5" /> Areas to Improve
                                            <span className="text-xs text-gray-500 font-normal ml-auto">Click to see fixes</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {feedbackReport.fix_next.map((fix, i) => {
                                                const isExpanded = expandedFixes.has(i);
                                                const repair = feedbackReport.one_liner_repair[i];
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${isExpanded
                                                            ? 'bg-gray-800 border-blue-500/50'
                                                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                                            }`}
                                                        onClick={() => {
                                                            setExpandedFixes(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(i)) next.delete(i);
                                                                else next.add(i);
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        <div className="flex gap-2 items-start">
                                                            <span className="text-red-500 mt-0.5">{isExpanded ? '▼' : '▶'}</span>
                                                            <span className="text-sm text-gray-300">{fix}</span>
                                                        </div>
                                                        {isExpanded && repair && (
                                                            <div className="mt-3 ml-5 p-3 bg-blue-900/20 border-l-4 border-blue-500 rounded-r">
                                                                <p className="text-xs text-blue-400 mb-1 font-semibold">💡 Try saying:</p>
                                                                <p className="text-sm text-gray-200 italic">"{repair}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Show remaining repairs that don't have matching fix_next items */}
                                {feedbackReport.one_liner_repair.length > feedbackReport.fix_next.length && (
                                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                                        <h3 className="font-bold text-gray-200 mb-3">Additional Tips</h3>
                                        <div className="space-y-2">
                                            {feedbackReport.one_liner_repair.slice(feedbackReport.fix_next.length).map((line, i) => (
                                                <div key={i} className="p-3 bg-gray-900 rounded border-l-4 border-blue-500 text-sm italic text-gray-300">
                                                    "{line}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center pt-6">
                                    <button
                                        onClick={() => setFeedbackReport(null)}
                                        className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
                                    >
                                        Start New Session
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

        </div>
    );
}
