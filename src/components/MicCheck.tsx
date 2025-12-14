import React, { useState, useEffect, useRef } from 'react';

interface MicCheckProps {
    onMicReady?: (stream: MediaStream) => void;
    className?: string;
}

export function MicCheck({ onMicReady, className = '' }: MicCheckProps) {
    const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
    const [volume, setVolume] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number>(0);

    const checkMicrophone = async () => {
        if (micStatus === 'active') return;

        setMicStatus('requesting');
        setErrorMessage('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Set up audio analysis
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            setMicStatus('active');
            onMicReady?.(stream);

            // Start volume monitoring
            const updateVolume = () => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setVolume(Math.min(1, avg / 50));
                }
                animationRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();

        } catch (error: any) {
            setMicStatus('error');
            if (error.name === 'NotAllowedError') {
                setErrorMessage('Microphone access denied');
            } else if (error.name === 'NotFoundError') {
                setErrorMessage('No microphone found');
            } else {
                setErrorMessage('Could not access microphone');
            }
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            streamRef.current?.getTracks().forEach(track => track.stop());
            audioContextRef.current?.close();
        };
    }, []);

    // Waveform bars
    const bars = 5;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {micStatus === 'idle' && (
                <button
                    onClick={checkMicrophone}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                    <span className="text-lg">🎤</span>
                    <span className="text-gray-300">Check Mic</span>
                </button>
            )}

            {micStatus === 'requesting' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg text-sm">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Requesting access...</span>
                </div>
            )}

            {micStatus === 'active' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <span className="text-green-400 text-sm">🎤 Mic Ready</span>
                    <div className="flex items-end gap-0.5 h-4">
                        {Array.from({ length: bars }).map((_, i) => {
                            const barHeight = Math.max(0.2, volume * (0.5 + (i / bars) * 0.5));
                            return (
                                <div
                                    key={i}
                                    className="w-1 bg-green-500 rounded-full transition-all duration-75"
                                    style={{ height: `${barHeight * 100}%` }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {micStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <span className="text-red-400 text-sm">⚠️ {errorMessage}</span>
                    <button
                        onClick={checkMicrophone}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
}
