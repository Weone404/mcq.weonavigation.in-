'use client';
import { Volume2, VolumeX } from 'lucide-react';

export default function ATCPanel({ phase, sessionState, onReplay }) {
    if (!phase) return null;

    const isSpeaking = sessionState === 'atc_speaking';

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : 'bg-gray-600'
                            }`}
                    />
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                        ATC Transmission — {phase.atcUnit}
                    </span>
                </div>
                <button
                    onClick={onReplay}
                    disabled={isSpeaking || sessionState === 'awaiting_pilot' === false}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition"
                >
                    <Volume2 size={14} />
                    Replay
                </button>
            </div>

            {/* ATC Message */}
            <div className="bg-black rounded-lg p-4 font-mono text-green-300 text-sm leading-relaxed border border-green-900">
                {isSpeaking ? (
                    <span className="flex items-center gap-2">
                        <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
                        {phase.atcDisplay}
                    </span>
                ) : (
                    phase.atcDisplay
                )}
            </div>

            {/* Hint */}
            <div className="flex items-start gap-2 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-2">
                <span className="text-yellow-400 text-xs mt-0.5">💡</span>
                <p className="text-yellow-300 text-xs font-mono">{phase.hint}</p>
            </div>
        </div>
    );
}