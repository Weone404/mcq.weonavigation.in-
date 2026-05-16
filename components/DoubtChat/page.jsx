"use client";
// components/DoubtChat.jsx
// AI Doubt Chat — with animated talking-face avatar + TTS

import { useState, useRef, useEffect } from "react";
import TalkingAvatar from ".././../app/dashboard/TalkingAvatar";
import { askDoubt, formatAnswer, QUICK_QUESTIONS } from "../../lib/doubtApi";

// ── TTS Engine ────────────────────────────────────────────────────────────────
function cleanForSpeech(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^[-•]\s/gm, "")
        .replace(/^\d+\.\s/gm, "")
        .replace(/#+ /g, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/\n+/g, ". ")
        .replace(/\.{2,}/g, ".")
        .trim();
}

function speakText(text, onEnd) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = cleanForSpeech(text);
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;
    utter.lang = "en-IN";
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Neural") ||
            v.name.includes("Natural") || v.name.includes("Wavenet"))
    ) || voices.find(v => v.lang.startsWith("en-IN"))
        || voices.find(v => v.lang.startsWith("en"));
    if (best) utter.voice = best;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis)
        window.speechSynthesis.cancel();
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoubtChat({ compact = false }) {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "👋 Hello! I'm your **captain** here, your DGCA study assistant.\n\nAsk me any aviation question and I'll answer — and read it out loud for you!",
            id: Date.now(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [historyForApi, setHistory] = useState([]);
    const [speakingId, setSpeakingId] = useState(null);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [, setVoicesReady] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const load = () => setVoicesReady(true);
        window.speechSynthesis.onvoiceschanged = load;
        if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
        return () => stopSpeaking();
    }, []);

    function autoSpeak(text, msgId) {
        if (!ttsEnabled) return;
        setSpeakingId(msgId);
        speakText(text, () => setSpeakingId(null));
    }

    async function sendMessage(questionText) {
        const q = String(questionText || input).trim();
        if (!q || loading) return;
        stopSpeaking();
        setSpeakingId(null);
        setInput("");
        setError("");
        const userMsg = { role: "user", text: q, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        try {
            const { answer } = await askDoubt(q, null, historyForApi, "chat");
            const botId = Date.now() + 1;
            const botMsg = { role: "assistant", text: answer, id: botId };
            setMessages(prev => [...prev, botMsg]);
            setHistory(prev => [...prev, { question: q, answer }]);
            autoSpeak(answer, botId);
        } catch (err) {
            setError(err.message || "Something went wrong.");
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "⚠️ Sorry, I couldn't process that. Please try again.",
                id: Date.now() + 1,
                isError: true,
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function toggleSpeak(msg) {
        if (speakingId === msg.id) {
            stopSpeaking();
            setSpeakingId(null);
        } else {
            setSpeakingId(msg.id);
            speakText(msg.text, () => setSpeakingId(null));
        }
    }

    function clearChat() {
        stopSpeaking();
        setSpeakingId(null);
        setMessages([{
            role: "assistant",
            text: "Chat cleared! Ask me anything.",
            id: Date.now(),
        }]);
        setHistory([]);
        setError("");
    }

    const isSpeaking = speakingId !== null;

    return (
        <div className={`dcw ${compact ? "compact" : ""}`}>
            <style>{CSS}</style>

            {/* ══ AVATAR PANEL ═══════════════════════════════════════════════ */}
            <div className={`avatar-panel ${isSpeaking ? "av-speaking" : ""}`}>
                {/* Ambient glow behind face when speaking */}
                <div className={`av-glow ${isSpeaking ? "active" : ""}`} />

                {/* Outer pulse ring */}
                <div className="av-ring-wrap">
                    <div className={`av-ring ${isSpeaking ? "active" : ""}`} />
                    {/* imageSrc: drop your photo at /public/avatar.jpg */}
                    <TalkingAvatar
                        isSpeaking={isSpeaking}
                        size={148}
                        imageSrc="/avatar.jpg"
                        name="Capt. AI"
                    />
                </div>

                {/* Info column */}
                <div className="av-info">
                    <div className="av-badge">DGCA AI</div>
                    <div className="av-name">Capt. AI</div>
                    <div className="av-title">Aviation Study Assistant</div>

                    {/* Live status */}
                    <div className="av-status-row">
                        <span className={`av-status-dot ${isSpeaking ? "speaking" : ""}`} />
                        <span className={`av-status-txt ${isSpeaking ? "speaking" : ""}`}>
                            {isSpeaking ? "Speaking…" : loading ? "Thinking…" : "Ready"}
                        </span>
                    </div>

                    {/* Sound-wave bars — visible while speaking */}
                    <div className={`av-waves ${isSpeaking ? "active" : ""}`}>
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="av-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ MESSAGES ═══════════════════════════════════════════════════ */}
            <div className="msgs-area">
                {messages.map(msg => (
                    <div key={msg.id} className={`msg-row ${msg.role === "user" ? "user" : "bot"}`}>
                        <div className={`avatar ${msg.role === "user" ? "user-av" : "bot-av"}`}>
                            {msg.role === "user" ? "S" : "🤖"}
                        </div>
                        <div className="bubble-wrap">
                            <div
                                className={`bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"} ${msg.isError ? "err-bubble" : ""}`}
                                dangerouslySetInnerHTML={{ __html: formatAnswer(msg.text) }}
                            />
                            {msg.role === "assistant" && !msg.isError && (
                                <button
                                    className={`speak-btn ${speakingId === msg.id ? "speaking" : ""}`}
                                    onClick={() => toggleSpeak(msg)}
                                    title={speakingId === msg.id ? "Stop speaking" : "Read aloud"}
                                >
                                    {speakingId === msg.id ? "⏹ Stop" : "🔊 Speak"}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="msg-row bot">
                        <div className="avatar bot-av">🤖</div>
                        <div className="typing-bubble">
                            <div className="dot" /><div className="dot" /><div className="dot" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ══ QUICK SUGGESTIONS ══════════════════════════════════════════ */}
            {messages.length <= 2 && (
                <div className="quick-btns">
                    {QUICK_QUESTIONS.map(q => (
                        <button key={q} className="quick-btn" onClick={() => sendMessage(q)}>{q}</button>
                    ))}
                </div>
            )}

            {/* ══ INPUT AREA ═════════════════════════════════════════════════ */}
            <div className="input-area">
                {error && <div className="error-msg">⚠️ {error}</div>}

                <div className="tts-bar">
                    <span className="tts-label">🔊 Auto-speak answers</span>
                    <button
                        className={`tts-toggle ${ttsEnabled ? "on" : "off"}`}
                        onClick={() => { setTtsEnabled(v => !v); if (ttsEnabled) stopSpeaking(); }}
                    >
                        {ttsEnabled ? "ON" : "OFF"}
                    </button>
                    {speakingId && (
                        <button className="stop-btn" onClick={() => { stopSpeaking(); setSpeakingId(null); }}>
                            ⏹ Stop
                        </button>
                    )}
                </div>

                <div className="input-row">
                    <textarea
                        ref={inputRef}
                        className="input-box"
                        placeholder="Ask any DGCA aviation question..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        rows={1}
                    />
                    <div className="action-btns">
                        <button className="clear-btn" onClick={clearChat} title="Clear chat">🗑️</button>
                        <button
                            className="send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                        >
                            {loading ? "..." : "Ask →"}
                        </button>
                    </div>
                </div>
                <div className="footer-hint">Enter to send · Shift+Enter for new line</div>
            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  .dcw {
    font-family: 'Sora', sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 80px);
    background: #0a0d14;
    color: #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
  }
  .dcw.compact { min-height: 400px; }

  /* ═══════════════════════════════════════
     AVATAR PANEL
  ═══════════════════════════════════════ */
  .avatar-panel {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 18px 22px 14px;
    background: linear-gradient(160deg, #07090f 0%, #0c111e 60%, #0a0d14 100%);
    border-bottom: 1px solid #131929;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    transition: background 0.5s;
  }
  .avatar-panel.av-speaking {
    background: linear-gradient(160deg, #070a12 0%, #0e1428 60%, #0a0d14 100%);
  }

  /* Ambient glow blob */
  .av-glow {
    position: absolute;
    left: 50px;
    top: 50%;
    transform: translateY(-50%);
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(79,70,229,0.12), transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.6s;
  }
  .av-glow.active {
    opacity: 1;
    animation: glowPulse 2s ease-in-out infinite;
  }
  @keyframes glowPulse {
    0%, 100% { transform: translateY(-50%) scale(1);   opacity: 0.7; }
    50%       { transform: translateY(-50%) scale(1.2); opacity: 1;   }
  }

  /* Ring wrap + pulse ring */
  .av-ring-wrap {
    position: relative;
    flex-shrink: 0;
    z-index: 1;
  }
  .av-ring {
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    border: 2px solid transparent;
    transition: border-color 0.4s, box-shadow 0.4s;
    pointer-events: none;
  }
  .av-ring.active {
    border-color: rgba(99, 102, 241, 0.7);
    box-shadow: 0 0 0 0 rgba(99,102,241,0.4);
    animation: ringPulse 1.6s ease-out infinite;
  }
  @keyframes ringPulse {
    0%   { box-shadow: 0 0 0 0   rgba(99,102,241,0.5); }
    70%  { box-shadow: 0 0 0 12px rgba(99,102,241,0);   }
    100% { box-shadow: 0 0 0 0   rgba(99,102,241,0);    }
  }

  /* Info column */
  .av-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    z-index: 1;
  }
  .av-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.25);
    color: #818cf8;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 20px;
    width: fit-content;
    margin-bottom: 2px;
  }
  .av-name {
    font-size: 16px;
    font-weight: 700;
    color: #e8eeff;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }
  .av-title {
    font-size: 11px;
    color: #4b5563;
    font-weight: 400;
  }
  .av-status-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .av-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
  }
  .av-status-dot.speaking {
    animation: dotPop 0.45s ease-in-out infinite alternate;
  }
  @keyframes dotPop {
    from { transform: scale(1);   background: #22c55e; }
    to   { transform: scale(1.4); background: #4ade80; }
  }
  .av-status-txt {
    font-size: 11px;
    color: #4b5563;
    transition: color 0.3s;
  }
  .av-status-txt.speaking { color: #4ade80; }

  /* Sound-wave bars */
  .av-waves {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 20px;
    margin-top: 6px;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .av-waves.active { opacity: 1; }
  .av-bar {
    width: 3px;
    border-radius: 2px;
    background: linear-gradient(to top, #4f46e5, #0ea5e9);
    animation: none;
    height: 4px;
  }
  .av-waves.active .av-bar {
    animation: barBounce 0.8s ease-in-out infinite alternate;
  }
  @keyframes barBounce {
    from { height: 4px;  opacity: 0.5; }
    to   { height: 18px; opacity: 1;   }
  }
  .av-bar:nth-child(1) { animation-delay: 0.00s; }
  .av-bar:nth-child(2) { animation-delay: 0.10s; }
  .av-bar:nth-child(3) { animation-delay: 0.20s; }
  .av-bar:nth-child(4) { animation-delay: 0.05s; }
  .av-bar:nth-child(5) { animation-delay: 0.15s; }
  .av-bar:nth-child(6) { animation-delay: 0.25s; }
  .av-bar:nth-child(7) { animation-delay: 0.08s; }

  /* ═══════════════════════════════════════
     MESSAGES
  ═══════════════════════════════════════ */
  .msgs-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scrollbar-width: thin;
    scrollbar-color: #1e293b transparent;
  }
  .msgs-area::-webkit-scrollbar { width: 4px; }
  .msgs-area::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

  .msg-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    animation: fadeUp 0.3s ease;
  }
  .msg-row.user { flex-direction: row-reverse; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0; font-weight: 600;
  }
  .bot-av  { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: white; }
  .user-av { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; }

  .bubble-wrap {
    display: flex; flex-direction: column;
    align-items: flex-start; gap: 4px; max-width: 80%;
  }
  .msg-row.user .bubble-wrap { align-items: flex-end; }

  .bubble {
    padding: 12px 16px; border-radius: 16px;
    font-size: 14px; line-height: 1.65;
  }
  .bot-bubble {
    background: #111827; border: 1px solid #1e293b;
    border-top-left-radius: 4px; color: #cbd5e1;
  }
  .user-bubble {
    background: linear-gradient(135deg, #1d4ed8, #4f46e5);
    color: white; border-top-right-radius: 4px;
  }
  .err-bubble { border-color: #7f1d1d !important; background: #1c0a0a !important; }

  .bubble strong { color: #93c5fd; }
  .bubble em     { color: #a5b4fc; font-style: italic; }
  .bubble ul     { padding-left: 18px; margin: 8px 0; }
  .bubble li     { margin: 4px 0; color: #94a3b8; }
  .bubble p      { margin: 6px 0; }
  .bubble p:first-child { margin-top: 0; }
  .bubble p:last-child  { margin-bottom: 0; }

  .speak-btn {
    background: none; border: 1px solid #1e293b; color: #4b5563;
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    cursor: pointer; font-family: 'Sora', sans-serif;
    transition: all 0.2s; display: flex; align-items: center; gap: 4px;
  }
  .speak-btn:hover { border-color: #6366f1; color: #a5b4fc; }
  .speak-btn.speaking {
    border-color: #0ea5e9; color: #38bdf8;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
  }

  .typing-bubble {
    background: #111827; border: 1px solid #1e293b;
    border-radius: 16px; border-top-left-radius: 4px;
    padding: 14px 18px; display: flex; align-items: center; gap: 5px;
  }
  .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4f46e5; animation: bounce 1.2s infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; background: #0ea5e9; }
  .dot:nth-child(3) { animation-delay: 0.4s; background: #22c55e; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%            { transform: translateY(-6px); }
  }

  /* Quick suggestions */
  .quick-btns {
    display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px;
  }
  .quick-btn {
    background: #0f172a; border: 1px solid #1e293b; color: #64748b;
    padding: 5px 12px; border-radius: 20px; font-size: 12px; cursor: pointer;
    transition: all 0.2s; font-family: 'Sora', sans-serif;
  }
  .quick-btn:hover { border-color: #4f46e5; color: #a5b4fc; background: #1e1b4b22; }

  /* Input area */
  .input-area {
    padding: 10px 16px 12px; border-top: 1px solid #1e293b;
    background: #0d1117; flex-shrink: 0;
  }
  .error-msg {
    color: #f87171; font-size: 12px; margin-bottom: 8px;
    padding: 6px 10px; background: #1c0a0a;
    border-radius: 6px; border-left: 3px solid #ef4444;
  }
  .tts-bar {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  }
  .tts-label { font-size: 11px; color: #4b5563; }
  .tts-toggle {
    padding: 2px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 700; cursor: pointer; border: none;
    font-family: 'Sora', sans-serif; transition: all 0.2s;
  }
  .tts-toggle.on  { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e55; }
  .tts-toggle.off { background: #374151;   color: #6b7280; border: 1px solid #374151; }
  .stop-btn {
    margin-left: auto; background: none; border: 1px solid #ef444455;
    color: #f87171; padding: 2px 10px; border-radius: 20px;
    font-size: 11px; cursor: pointer; font-family: 'Sora', sans-serif;
    animation: pulse 1.5s infinite;
  }
  .input-row { display: flex; gap: 8px; align-items: flex-end; }
  .input-box {
    flex: 1; background: #111827; border: 1px solid #1e293b;
    color: #e2e8f0; padding: 10px 14px; border-radius: 12px;
    font-size: 14px; font-family: 'Sora', sans-serif; resize: none;
    outline: none; min-height: 42px; max-height: 120px;
    transition: border-color 0.2s; line-height: 1.5;
  }
  .input-box:focus    { border-color: #4f46e5; }
  .input-box::placeholder { color: #374151; }
  .action-btns { display: flex; gap: 6px; }
  .send-btn {
    background: linear-gradient(135deg, #4f46e5, #0ea5e9);
    border: none; color: white; padding: 10px 18px; border-radius: 10px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    font-family: 'Sora', sans-serif; white-space: nowrap;
  }
  .send-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .clear-btn {
    background: none; border: 1px solid #1e293b; color: #475569;
    padding: 10px 12px; border-radius: 10px;
    font-size: 12px; cursor: pointer; transition: all 0.2s;
  }
  .clear-btn:hover { border-color: #475569; color: #94a3b8; }
  .footer-hint {
    margin-top: 8px; font-size: 11px; color: #374151; text-align: center;
  }
`;