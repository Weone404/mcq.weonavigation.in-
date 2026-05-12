'use client';
import Link from 'next/link';

export default function ExamResultSheet({ result, scenario, duration }) {
    if (!result) return null;

    const { totalScore, maxTotalScore, percentage, passed, examinerRemarks, phases } = result;

    const gradeColor = passed ? 'text-green-400' : 'text-red-400';
    const gradeBg = passed ? 'border-green-500 bg-green-950' : 'border-red-500 bg-red-950';

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className={`border rounded-xl p-6 text-center ${gradeBg}`}>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-2">
                    DGCA RTR(A) Part 2 Simulation Result
                </p>
                <p className={`text-5xl font-bold font-mono ${gradeColor}`}>
                    {percentage}%
                </p>
                <p className={`text-xl font-mono mt-1 ${gradeColor}`}>
                    {passed ? '✓ PASS' : '✗ FAIL'}
                </p>
                <p className="text-gray-400 text-sm mt-2 font-mono">
                    {totalScore} / {maxTotalScore} marks · {Math.floor(duration / 60)}m {duration % 60}s
                </p>
            </div>

            {/* Phase breakdown */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm font-mono">
                    <thead>
                        <tr className="bg-gray-800 text-gray-400 text-xs uppercase">
                            <th className="text-left px-4 py-2">Phase</th>
                            <th className="text-center px-4 py-2">Score</th>
                            <th className="text-center px-4 py-2">%</th>
                            <th className="text-center px-4 py-2">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map((p, i) => (
                            <tr key={i} className="border-t border-gray-800">
                                <td className="px-4 py-2 text-gray-300">{p.phaseLabel}</td>
                                <td className="px-4 py-2 text-center text-white">
                                    {p.score}/{p.maxScore}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <span
                                        className={
                                            p.percentage >= 70
                                                ? 'text-green-400'
                                                : p.percentage >= 50
                                                    ? 'text-yellow-400'
                                                    : 'text-red-400'
                                        }
                                    >
                                        {p.percentage}%
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    {p.passed ? (
                                        <span className="text-green-400">✓</span>
                                    ) : (
                                        <span className="text-red-400">✗</span>
                                    )}
                                    {p.criticalMistake && (
                                        <span className="text-red-500 text-xs ml-1">(Critical)</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Examiner Remarks */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-2">
                    Examiner Remarks
                </p>
                <p className="text-gray-200 text-sm font-mono leading-relaxed">
                    {examinerRemarks}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Link
                    href="/rtr/practice"
                    className="flex-1 text-center py-3 bg-blue-800 hover:bg-blue-700 text-white rounded-xl font-mono text-sm transition"
                >
                    Practice Again
                </Link>
                <Link
                    href="/rtr/mock-exam"
                    className="flex-1 text-center py-3 bg-green-800 hover:bg-green-700 text-white rounded-xl font-mono text-sm transition"
                >
                    Mock Exam
                </Link>
            </div>
        </div>
    );
}