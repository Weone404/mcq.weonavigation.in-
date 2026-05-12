'use client';

export default function ScoringPanel({ result, phaseIndex }) {
    if (!result) return null;

    const phaseResult = result.phases[phaseIndex];
    if (!phaseResult) return null;

    const pct = phaseResult.percentage;
    const color = pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';
    const barColor = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                    Phase Score
                </span>
                <span className={`font-mono font-bold text-lg ${color}`}>
                    {phaseResult.score}/{phaseResult.maxScore}
                </span>
            </div>

            {/* Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Deductions */}
            {phaseResult.deductions.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-mono uppercase">Deductions</p>
                    {phaseResult.deductions.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs font-mono">
                            <span className="text-red-400">— {d.reason}</span>
                            <span className="text-red-400">-{d.points}pts</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Expected readback */}
            <div className="bg-gray-800 rounded p-3">
                <p className="text-xs text-gray-500 font-mono uppercase mb-1">Expected Readback</p>
                <p className="text-yellow-300 font-mono text-xs">{phaseResult.expectedReadback}</p>
            </div>
        </div>
    );
}