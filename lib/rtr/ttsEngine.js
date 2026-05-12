/**
 * ATC Text-to-Speech using Web Speech API
 * Falls back gracefully if not supported
 */

export function speakATC(text, onEnd) {
    if (typeof window === 'undefined') return;
    if (!window.speechSynthesis) {
        console.warn('SpeechSynthesis not supported');
        if (onEnd) onEnd();
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Pick best available voice — prefer male English voice for ATC feel
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
        (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
                v.name.toLowerCase().includes('david') ||
                v.name.toLowerCase().includes('george') ||
                v.name.toLowerCase().includes('daniel'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.rate = 0.88;   // slightly slower than normal — ATC pace
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
}

export function stopATC() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}