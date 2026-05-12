'use client';
import { Mic, MicOff, Send } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useEffect } from 'react';

export default function PilotMic({ onSubmit, disabled }) {
    const {
        transcript,
        isListening,
        error,
        startListening,
        stopListening,
        resetTranscript,
    } = useSpeechRecognition();

    const handleSubmit = () => {
        if (!transcript.trim()) return;
        onSubmit(transcript);
        resetTranscript();
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
                <div
                    className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-gray-600'
                        }`}
                />
                <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                    Pilot Transmission
                </span>
            </div>

            {/* Transcript box */}
            <div className="bg-black rounded-lg p-4 min-h-[72px] border border-gray-800 font-mono text-white text-sm">
                {isListening && !transcript && (
                    <span className="text-gray-600 italic">Listening…</span>
                )}
                {transcript || (!isListening && <span className="text-gray-600 italic">Press mic to speak</span>)}
            </div>

            {error && (
                <p className="text-red-400 text-xs font-mono">{error}</p>
            )}

            {/* Controls */}
            <div className="flex gap-3">
                <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition
            ${isListening
                            ? 'bg-red-700 hover:bg-red-600 text-white'
                            : 'bg-blue-800 hover:bg-blue-700 text-white'
                        }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
                >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {isListening ? 'Stop' : 'PTT'}
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!transcript.trim() || disabled}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-800 hover:bg-green-700 text-white font-mono text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Send size={16} />
                    Submit
                </button>
            </div>
        </div>
    );
}