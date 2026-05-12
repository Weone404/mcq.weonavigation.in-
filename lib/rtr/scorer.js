import { validateTranscript, generateExaminerRemarks } from './phraseologyRules';

export function scoreSession(transcripts, scenario) {
    let totalScore = 0;
    let maxTotalScore = 0;
    const phasesResult = [];

    scenario.phases.forEach((phase, index) => {
        const transcript = transcripts[index] || '';
        const result = validateTranscript(transcript, phase);

        phasesResult.push({
            phaseId: phase.id,
            phaseLabel: phase.label,
            pilotTranscript: transcript,
            expectedReadback: phase.expectedReadback,
            score: result.score,
            maxScore: phase.maxScore,
            deductions: result.deductions,
            missingKeywords: result.missingKeywords,
            criticalMistake: result.criticalMistake,
            percentage: result.percentage,
            passed: result.percentage >= 60,
        });

        totalScore += result.score;
        maxTotalScore += phase.maxScore;
    });

    const percentage = Math.round((totalScore / maxTotalScore) * 100);
    const passed = percentage >= 70;
    const examinerRemarks = generateExaminerRemarks(phasesResult, percentage);

    return {
        phases: phasesResult,
        totalScore,
        maxTotalScore,
        percentage,
        passed,
        examinerRemarks,
    };
}