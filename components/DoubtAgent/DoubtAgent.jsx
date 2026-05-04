"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./DoubtAgent.module.css";
import { askDoubt, askDoubtVoice, buildAudioUrl } from "../../lib/doubtApi";

// ── Voice recorder hook ────────────────────────────────────────────────────
export function useVoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const formattedDuration = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const startRecording = async () => {
        setAudioBlob(null);
        setError(null);
        setDuration(0);
        chunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach((t) => t.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } catch (err) {
            setError("Microphone access denied. Please allow mic permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setDuration(0);
        setError(null);
    };

    return { isRecording, audioBlob, error, duration, formattedDuration, startRecording, stopRecording, resetRecording };
}

// ── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === "user";
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); }
    };

    return (
        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAgent}`}>
            {!isUser && (
                <div className={styles.agentLabel}>
                    <span className={styles.agentDot} />
                    AI Doubt Agent
                </div>
            )}
            <p className={styles.bubbleText}>{msg.content}</p>

            {msg.audio_url && (
                <div className={styles.audioRow}>
                    <audio ref={audioRef} src={buildAudioUrl(msg.audio_url)} onEnded={() => setPlaying(false)} />
                    <button className={styles.audioBtn} onClick={toggleAudio}>
                        {playing ? "⏸ Pause" : "🔊 Play Answer"}
                    </button>
                </div>
            )}

            {msg.sources?.length > 0 && (
                <div className={styles.sources}>
                    <span className={styles.sourcesLabel}>Sources:</span>
                    {msg.sources.map((s, i) => (
                        <span key={i} className={styles.sourceChip}>{s.title || s}</span>
                    ))}
                </div>
            )}

            <span className={styles.bubbleTime}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
        </div>
    );
}

// ── Main DoubtAgent component ──────────────────────────────────────────────
export default function DoubtAgent({ subjects = [], studentId = "guest", defaultSubjectId }) {
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "agent",
            content: "Hello! I'm your DGCA Doubt Agent. Select a subject and ask me anything — type your question or record your voice.",
            timestamp: new Date().toISOString(),
        },
    ]);
    const [input, setInput] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(defaultSubjectId || subjects[0]?.id || "");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("text"); // "text" | "voice"

    const bottomRef = useRef(null);
    const { isRecording, audioBlob, error: micError, formattedDuration, startRecording, stopRecording, resetRecording } = useVoiceRecorder();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Auto-select first subject when subjects load
    useEffect(() => {
        if (!selectedSubject && subjects.length > 0) {
            setSelectedSubject(subjects[0].id);
        }
    }, [subjects]);

    const addMessage = (role, content, extras = {}) => {
        const msg = { id: Date.now().toString(), role, content, timestamp: new Date().toISOString(), ...extras };
        setMessages((prev) => [...prev, msg]);
        return msg;
    };

    const handleTextSubmit = async () => {
        const q = input.trim();
        if (!q || loading) return;
        setInput("");
        addMessage("user", q);
        setLoading(true);
        try {
            const data = await askDoubt({ question: q, studentId, subjectId: selectedSubject });
            addMessage("agent", data.answer, { audio_url: data.audio_url, sources: data.sources });
        } catch (e) {
            addMessage("agent", `Sorry, I couldn't get an answer. ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceSubmit = async () => {
        if (!audioBlob || loading) return;
        setLoading(true);
        addMessage("user", "🎙️ [Voice question sent]");
        try {
            const data = await askDoubtVoice({ audioBlob, studentId, subjectId: selectedSubject });
            if (data.question) addMessage("user", `Transcribed: "${data.question}"`);
            addMessage("agent", data.answer, { audio_url: data.audio_url, sources: data.sources });
        } catch (e) {
            addMessage("agent", `Voice processing failed. ${e.message}`);
        } finally {
            setLoading(false);
            resetRecording();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
    };

    return (
        <div className={styles.container}>
            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <span className={styles.statusDot} />
                    <span className={styles.statusText}>Doubt Agent Online</span>
                </div>

                {subjects.length > 0 && (
                    <select
                        className={styles.subjectSelect}
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}

                <div className={styles.modeToggle}>
                    <button className={`${styles.modeBtn} ${mode === "text" ? styles.modeActive : ""}`} onClick={() => setMode("text")}>
                        ✏️ Text
                    </button>
                    <button className={`${styles.modeBtn} ${mode === "voice" ? styles.modeActive : ""}`} onClick={() => setMode("voice")}>
                        🎙️ Voice
                    </button>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className={styles.messages}>
                {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                {loading && (
                    <div className={styles.typing}>
                        <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input area ── */}
            <div className={styles.inputArea}>
                {mode === "text" ? (
                    <div className={styles.textRow}>
                        <textarea
                            className={styles.textarea}
                            placeholder="Type your DGCA doubt here… (Enter to send)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                        />
                        <button className={styles.sendBtn} onClick={handleTextSubmit} disabled={!input.trim() || loading}>
                            {loading ? "..." : "Send →"}
                        </button>
                    </div>
                ) : (
                    <div className={styles.voiceRow}>
                        {micError && <p className={styles.micError}>{micError}</p>}

                        {!audioBlob ? (
                            <button
                                className={`${styles.recordBtn} ${isRecording ? styles.recording : ""}`}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? `⏹ Stop  ${formattedDuration}` : "🎙️ Hold to Record"}
                            </button>
                        ) : (
                            <div className={styles.voiceActions}>
                                <span className={styles.recorded}>✅ Voice recorded</span>
                                <button className={styles.sendBtn} onClick={handleVoiceSubmit} disabled={loading}>
                                    {loading ? "Processing…" : "Submit Voice →"}
                                </button>
                                <button className={styles.resetBtn} onClick={resetRecording}>✕ Redo</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}