/**
 * Normalizes transcript for comparison
 */
function normalize(text) {
    return text
        .toLowerCase()
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Checks if a keyword is present in the transcript
 * Handles numeric equivalents (e.g. "2341" vs "two three four one")
 */
const DIGIT_WORDS = {
    '0': ['zero', '0'],
    '1': ['one', '1'],
    '2': ['two', '2'],
    '3': ['three', '3'],
    '4': ['four', '4'],
    '5': ['five', '5'],
    '6': ['six', '6'],
    '7': ['seven', '7'],
    '8': ['eight', '8'],
    '9': ['nine', '9'],
};

function buildNumberVariants(keyword) {
    const variants = [keyword];
    // if keyword contains digits, build spoken variant
    const spoken = keyword
        .split('')
        .map((ch) => (DIGIT_WORDS[ch] ? DIGIT_WORDS[ch][0] : ch))
        .join(' ')
        .replace(/\s+/g, ' ');
    variants.push(spoken);
    return variants;
}

function keywordFound(keyword, transcript) {
    const normalized = normalize(transcript);
    const variants = buildNumberVariants(normalize(keyword));
    return variants.some((v) => normalized.includes(v));
}

/**
 * Main validation function
 * Returns { score, deductions, missingKeywords, criticalMistake, percentage }
 */
export function validateTranscript(transcript, phase) {
    const {
        requiredKeywords,
        criticalKeywords,
        maxScore,
    } = phase;

    if (!transcript || transcript.trim() === '') {
        return {
            score: 0,
            deductions: [{ reason: 'No response given', points: maxScore }],
            missingKeywords: requiredKeywords,
            criticalMistake: true,
            percentage: 0,
        };
    }

    const deductions = [];
    const missingKeywords = [];
    let totalDeducted = 0;
    let criticalMistake = false;

    const deductionPerKeyword = Math.floor(maxScore / requiredKeywords.length);

    for (const keyword of requiredKeywords) {
        if (!keywordFound(keyword, transcript)) {
            missingKeywords.push(keyword);
            const isCritical = criticalKeywords.includes(keyword);
            const points = isCritical
                ? Math.min(deductionPerKeyword * 2, maxScore - totalDeducted)
                : deductionPerKeyword;

            deductions.push({
                reason: `Missing: "${keyword}"${isCritical ? ' (CRITICAL)' : ''}`,
                points,
            });
            totalDeducted += points;

            if (isCritical) criticalMistake = true;
        }
    }

    // Check if callsign is missing at the end (RT discipline)
    const normalizedTranscript = normalize(transcript);
    const callsignLower = normalize(phase.requiredKeywords.find(k => k.includes('VT-')) || '');
    if (callsignLower && !normalizedTranscript.endsWith(callsignLower.replace('vt-', 'vt '))) {
        if (!keywordFound(callsignLower, transcript)) {
            deductions.push({ reason: 'Callsign missing or not at end', points: 3 });
            totalDeducted += 3;
        }
    }

    const score = Math.max(0, maxScore - totalDeducted);
    const percentage = Math.round((score / maxScore) * 100);

    return {
        score,
        deductions,
        missingKeywords,
        criticalMistake,
        percentage,
    };
}

/**
 * Generate examiner remarks based on overall performance
 */
export function generateExaminerRemarks(phases, totalPercentage) {
    const emergencyPhase = phases.find((p) => p.phaseId === 'emergency');
    const hasCriticalMistake = phases.some((p) => p.criticalMistake);

    if (totalPercentage >= 85) {
        return 'Excellent RT discipline. Phraseology was accurate, readbacks were complete. Candidate demonstrates strong communication skills suitable for RTR(A) standard.';
    } else if (totalPercentage >= 70) {
        return 'Good overall performance. Minor omissions in readbacks noted. Candidate should review ICAO phraseology for frequency change and arrival procedures.';
    } else if (totalPercentage >= 50) {
        return hasCriticalMistake
            ? 'Unsatisfactory. Critical RT errors detected — missing squawk/runway readback or incomplete emergency call. Significant practice required before appearing for RTR(A) exam.'
            : 'Below standard. Several required items were omitted from readbacks. Candidate must practice all 6 phases consistently before attempting mock exam.';
    } else {
        return 'Fail. Fundamental RT procedures not followed. Complete revision of ICAO Doc 9432 phraseology and RTR(A) study material strongly recommended.';
    }
}