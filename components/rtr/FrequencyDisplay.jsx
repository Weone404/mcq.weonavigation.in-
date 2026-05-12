'use client';
export default function FrequencyDisplay({ frequency, unit }) {
    return (
        <div className="flex items-center gap-3 bg-black border border-green-500 rounded-lg px-4 py-2">
            <span className="text-green-400 text-xs uppercase tracking-widest font-mono">
                {unit || 'ATC'}
            </span>
            <span className="text-green-300 text-2xl font-mono font-bold tracking-widest">
                {frequency || '---.-'}
            </span>
            <span className="text-green-600 text-xs font-mono">MHz</span>
        </div>
    );
}