// lib/doubtApi.js
// Doubt Resolution Agent API utility - connects to FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Ask a doubt question (text-based)
 * Searches all videos + PDFs in the subject for relevant content
 */
export async function askDoubt({ question, studentId, subjectId, language = "en" }) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/doubt/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question,
                student_id: studentId,
                subject_id: subjectId,
                language,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API Error: ${res.status}`);
        }

        const data = await res.json();
        return {
            answer: data.answer || data.response,
            audio_url: data.audio_url || null,
            confidence: data.confidence || 0.8,
            sources: data.sources || [],
            session_id: data.session_id || null,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[doubtApi] askDoubt error:", error);
        throw error;
    }
}

/**
 * Send voice recording as audio file for transcription + answer
 * Audio is converted to text, then processed like text question
 */
export async function askDoubtVoice({ audioBlob, studentId, subjectId, language = "en" }) {
    try {
        const formData = new FormData();
        formData.append("audio_file", audioBlob, "recording.webm");
        formData.append("student_id", studentId);
        formData.append("subject_id", subjectId);
        formData.append("language", language);

        const res = await fetch(`${API_BASE_URL}/api/v1/doubt/ask-voice`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `API Error: ${res.status}`);
        }

        const data = await res.json();
        return {
            question: data.question || data.transcribed_question || "",
            answer: data.answer || data.response || "",
            audio_url: data.audio_url || null,
            confidence: data.confidence || 0.8,
            sources: data.sources || [],
            session_id: data.session_id || null,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[doubtApi] askDoubtVoice error:", error);
        throw error;
    }
}

/**
 * Get available subjects for the doubt agent
 */
export async function getSubjects() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/mcq/subjects`);
        if (!res.ok) throw new Error("Failed to fetch subjects");
        return await res.json();
    } catch (error) {
        console.error("[doubtApi] getSubjects error:", error);
        throw error;
    }
}

/**
 * Fetch doubt history for a student
 */
export async function getDoubtHistory(studentId, limit = 20) {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/v1/doubt/history/${studentId}?limit=${limit}`
        );
        if (!res.ok) throw new Error("Failed to fetch history");
        return await res.json();
    } catch (error) {
        console.error("[doubtApi] getDoubtHistory error:", error);
        throw error;
    }
}

/**
 * Build full audio URL (handles relative paths from backend)
 */
export function buildAudioUrl(audioPath) {
    if (!audioPath) return null;
    if (audioPath.startsWith("http")) return audioPath;
    return `${API_BASE_URL}/${audioPath.replace(/^\//, "")}`;
}