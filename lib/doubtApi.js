// lib/doubtApi.js
// Client-side helpers for the AI Doubt Solver (Gemini backend)

/**
 * Convert a PDF File object to base64 string
 */
export async function pdfToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read PDF file"));
        reader.readAsDataURL(file);
    });
}

/**
 * Ask a question to the AI doubt solver
 * @param {string} question
 * @param {string|null} pdfBase64 - only on first PDF message
 * @param {Array}  history        - [{question, answer, pdfBase64?}]
 * @param {string} mode           - "pdf" | "chat"
 */
export async function askDoubt(question, pdfBase64 = null, history = [], mode = "chat") {
    const res = await fetch("/api/doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question: String(question),
            pdfBase64,
            history,
            mode,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get answer");
    }

    return res.json(); // { answer }
}

/**
 * Ask via voice transcript — same backend, just a semantic alias
 */
export async function askDoubtVoice(transcript, pdfBase64 = null, history = []) {
    return askDoubt(
        String(transcript),
        pdfBase64,
        history,
        pdfBase64 && history.length === 0 ? "pdf" : "chat"
    );
}

/**
 * Build a TTS audio URL for an answer (uses browser speech synthesis — no API needed)
 * Returns null if called server-side
 */
export function buildAudioUrl(text) {
    if (!text || typeof window === "undefined") return null;
    // We use Web Speech API (browser built-in, completely free)
    // Store the text so the component can call speechSynthesis.speak()
    return `tts:${String(text).slice(0, 300)}`;
}

/**
 * Speak text using the browser's built-in speech synthesis (free, no API)
 * @param {string} text
 */
export function speakText(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, ""));
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
}

/**
 * Format markdown-style answer text to HTML
 */
export function formatAnswer(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/^[-•]\s(.+)$/gm, "<li>$1</li>")
        .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
        .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
        .replace(/<\/ul><ul>/g, "")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br/>")
        .replace(/^/, "<p>")
        .replace(/$/, "</p>");
}

/**
 * Quick question suggestions shown at the start of a chat
 */
export const QUICK_QUESTIONS = [
    "Explain this concept in simple terms",
    "Give me a summary of the key points",
    "What are the most important things to remember?",
    "Can you give me an example?",
    "What exam questions can come from this topic?",
    "Create a short quiz on this topic",
];