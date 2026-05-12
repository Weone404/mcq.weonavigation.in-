'use client';
import { useState, useRef, useCallback } from 'react';
import { speakATC, stopATC } from '../lib/rtr/ttsEngine';

export function useRtrSession(scenario) {
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [sessionState, setSessionState] = useState('idle');
    // idle | atc_speaking | awaiting_pilot | submitted | completed
    const [transcripts, setTranscripts] = useState([]);
    const [phaseStartTime, setPhaseStartTime] = useState(null);
    const startTimeRef = useRef(null);

    const currentPhase = scenario?.phases[currentPhaseIndex] || null;
    const isLastPhase = currentPhaseIndex === (scenario?.phases.length || 0) - 1;

    const startSession = useCallback(() => {
        setCurrentPhaseIndex(0);
        setTranscripts([]);
        setSessionState('atc_speaking');
        startTimeRef.current = Date.now();

        const phase = scenario.phases[0];
        setPhaseStartTime(Date.now());
        speakATC(phase.atcSpeech, () => {
            setSessionState('awaiting_pilot');
        });
    }, [scenario]);

    const submitPilotResponse = useCallback(
        (transcript) => {
            const timeTaken = phaseStartTime
                ? Math.round((Date.now() - phaseStartTime) / 1000)
                : 0;

            setTranscripts((prev) => [
                ...prev,
                { transcript, timeTaken },
            ]);
            setSessionState('submitted');
        },
        [phaseStartTime]
    );

    const goToNextPhase = useCallback(() => {
        if (isLastPhase) {
            setSessionState('completed');
            return;
        }

        const nextIndex = currentPhaseIndex + 1;
        setCurrentPhaseIndex(nextIndex);
        setSessionState('atc_speaking');

        const nextPhase = scenario.phases[nextIndex];
        setPhaseStartTime(Date.now());
        speakATC(nextPhase.atcSpeech, () => {
            setSessionState('awaiting_pilot');
        });
    }, [currentPhaseIndex, isLastPhase, scenario]);

    const replayATC = useCallback(() => {
        if (!currentPhase) return;
        setSessionState('atc_speaking');
        speakATC(currentPhase.atcSpeech, () => {
            setSessionState('awaiting_pilot');
        });
    }, [currentPhase]);

    const stopSession = useCallback(() => {
        stopATC();
        setSessionState('idle');
    }, []);

    const totalDuration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;

    return {
        currentPhase,
        currentPhaseIndex,
        sessionState,
        transcripts,
        isLastPhase,
        totalDuration,
        startSession,
        submitPilotResponse,
        goToNextPhase,
        replayATC,
        stopSession,
    };
}