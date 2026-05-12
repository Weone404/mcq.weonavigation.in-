'use client';

export default function TranscriptPanel({ transcripts, phases }) {
    if (!transcripts.length) return null;

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                Session Transcript
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {transcripts.map((t, i) => {
                    const phase = phases[i];
                    return (
                        <div key={i} className="space-y-1">
                            {/* ATC line */}
                            <div className="flex gap-2">
                                <span className="text-green-500 font-mono text-xs w-8 shrink-0">ATC</span>
                                <p className="text-green-300 font-mono text-xs">{phase?.atcDisplay}</p>
                            </div>
                            {/* Pilot line */}
                            <div className="flex gap-2">
                                <span className="text-blue-400 font-mono text-xs w-8 shrink-0">PLT</span>
                                <p className="text-blue-200 font-mono text-xs">{t.transcript || '(no response)'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}