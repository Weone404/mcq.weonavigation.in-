'use client';

const PHASE_ICONS = ['🔌', '🛞', '🛫', '📡', '🚨', '🛬'];

export default function ScenarioProgress({ phases, currentIndex, sessionState }) {
    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {phases.map((phase, i) => {
                const isCompleted = i < currentIndex;
                const isCurrent = i === currentIndex;
                const isPending = i > currentIndex;

                return (
                    <div key={phase.id} className="flex items-center gap-1">
                        <div
                            className={`flex flex-col items-center min-w-[64px] px-2 py-1 rounded-lg text-center transition-all
                ${isCompleted ? 'bg-green-900 border border-green-500' : ''}
                ${isCurrent ? 'bg-blue-900 border border-blue-400 animate-pulse' : ''}
                ${isPending ? 'bg-gray-900 border border-gray-700 opacity-50' : ''}
              `}
                        >
                            <span className="text-lg">{PHASE_ICONS[i]}</span>
                            <span
                                className={`text-[10px] font-mono mt-0.5
                  ${isCompleted ? 'text-green-300' : ''}
                  ${isCurrent ? 'text-blue-300' : ''}
                  ${isPending ? 'text-gray-500' : ''}
                `}
                            >
                                {phase.label.split(' ')[0]}
                            </span>
                        </div>
                        {i < phases.length - 1 && (
                            <div
                                className={`h-px w-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}