'use client';
// components/AliaWidget/page.jsx
// Floating AI chat widget — uses your /api/doubt Gemini route + TTS

import { useState, useRef, useEffect } from 'react';
import { askDoubt, formatAnswer, QUICK_QUESTIONS } from '../../lib/doubtApi';

// ── Wrap question with a brevity instruction ──────────────────────────────────
function withBrevity(question) {
    return `Answer in exactly 1 to 2 lines. Be extremely concise and direct. No bullet points, no headers, no lists.\n\nQuestion: ${question}`;
}

// ── TTS helpers ───────────────────────────────────────────────────────────────
function cleanForSpeech(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^[-•]\s/gm, '')
        .replace(/^\d+\.\s/gm, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n+/g, '. ')
        .replace(/\.{2,}/g, '.')
        .trim();
}

function speak(text, onEnd) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleanForSpeech(text));
    utter.rate = 0.93; utter.pitch = 1.05; utter.lang = 'en-IN';
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Natural'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (best) utter.voice = best;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis)
        window.speechSynthesis.cancel();
}

// ── Widget ────────────────────────────────────────────────────────────────────
export default function AliaWidget() {
    const [open, setOpen] = useState(false);
    const [hidden, setHidden] = useState(false);  // ✅ hide on mock test
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! I'm **EduBot** ✈️\nAsk me anything about DGCA aviation!", id: 1 }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');
    const [speakingId, setSpeakingId] = useState(null);
    const [tts, setTts] = useState(true);
    const [unread, setUnread] = useState(0);

    const msgsRef = useRef(null);
    const inputRef = useRef(null);

    // ✅ Watch body attribute set by DashboardPage when mock test is active
    useEffect(() => {
        function check() {
            const shouldHide = document.body.getAttribute('data-hide-widget') === 'true';
            setHidden(shouldHide);
            // Close the panel too if we're hiding
            if (shouldHide) {
                setOpen(false);
                stopSpeaking();
                setSpeakingId(null);
            }
        }

        // Run once on mount
        check();

        // Watch for future attribute changes
        const observer = new MutationObserver(check);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-hide-widget'],
        });

        return () => observer.disconnect();
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }, [messages, loading]);

    // Load voices
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.onvoiceschanged = () => { };
        return () => stopSpeaking();
    }, []);

    // Clear unread when opened
    useEffect(() => { if (open) setUnread(0); }, [open]);

    // ✅ Don't render anything while hidden
    if (hidden) return null;

    async function sendMessage(q) {
        const question = String(q || input).trim();
        if (!question || loading) return;

        stopSpeaking();
        setSpeakingId(null);
        setInput('');
        setError('');

        const userMsg = { role: 'user', text: question, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            // ✅ Wrap question with brevity instruction — keeps answers to 3–4 lines
            const { answer } = await askDoubt(withBrevity(question), null, history, 'chat');

            const botId = Date.now() + 1;
            const botMsg = { role: 'bot', text: answer, id: botId };
            setMessages(prev => [...prev, botMsg]);
            // Store original question (not the wrapped one) in history
            setHistory(prev => [...prev, { question, answer }]);

            // 🔊 Auto-speak
            if (tts) {
                setSpeakingId(botId);
                speak(answer, () => setSpeakingId(null));
            }

            // Unread badge if closed
            if (!open) setUnread(n => n + 1);

        } catch (err) {
            setError(err.message || 'Something went wrong.');
            setMessages(prev => [...prev, {
                role: 'bot',
                text: '⚠️ Could not get answer. Please try again.',
                id: Date.now() + 1,
                isError: true,
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }

    function toggleSpeak(msg) {
        if (speakingId === msg.id) { stopSpeaking(); setSpeakingId(null); }
        else { setSpeakingId(msg.id); speak(msg.text, () => setSpeakingId(null)); }
    }

    function clearChat() {
        stopSpeaking(); setSpeakingId(null);
        setMessages([{ role: 'bot', text: 'Chat cleared! Ask me anything.', id: Date.now() }]);
        setHistory([]); setError('');
    }

    function toggleOpen() {
        setOpen(o => !o);
        stopSpeaking();
        setSpeakingId(null);
    }

    return (
        <>
            <style>{CSS}</style>

            {/* ── Chat Panel ── */}
            {open && (
                <div className="alia-panel">

                    {/* Header */}
                    <div className="alia-header">
                        <div className="alia-header-left">
                            <div className="alia-avatar-sm">🤖</div>
                            <div>
                                <div className="alia-name">EduBot</div>
                                <div className="alia-status">● Online</div>
                            </div>
                        </div>
                        <div className="alia-header-right">
                            {/* TTS toggle */}
                            <button
                                className={`tts-pill ${tts ? 'tts-on' : 'tts-off'}`}
                                onClick={() => { setTts(v => !v); if (tts) stopSpeaking(); }}
                                title="Toggle voice"
                            >
                                {tts ? '🔊' : '🔇'}
                            </button>
                            {/* Clear */}
                            <button className="icon-btn" onClick={clearChat} title="Clear chat">🗑️</button>
                            {/* Close */}
                            <button className="icon-btn close-x" onClick={() => setOpen(false)}>✕</button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="alia-msgs" ref={msgsRef}>
                        {messages.map(m => (
                            <div key={m.id} className={`alia-row ${m.role === 'user' ? 'user-row' : 'bot-row'}`}>

                                {m.role === 'bot' && (
                                    <div className="alia-av">🤖</div>
                                )}

                                <div className="alia-bubble-wrap">
                                    <div
                                        className={`alia-bubble ${m.role === 'user' ? 'user-b' : 'bot-b'} ${m.isError ? 'err-b' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: formatAnswer(m.text) }}
                                    />
                                    {/* 🔊 speak button on bot messages */}
                                    {m.role === 'bot' && !m.isError && (
                                        <button
                                            className={`mini-speak ${speakingId === m.id ? 'speaking' : ''}`}
                                            onClick={() => toggleSpeak(m)}
                                        >
                                            {speakingId === m.id ? '⏹' : '🔊'}
                                        </button>
                                    )}
                                </div>

                                {m.role === 'user' && (
                                    <div className="alia-av user-av">S</div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="alia-row bot-row">
                                <div className="alia-av">🤖</div>
                                <div className="alia-typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}

                        <div ref={undefined} />
                    </div>

                    {/* Quick suggestions */}
                    {messages.length <= 2 && (
                        <div className="alia-quick">
                            {QUICK_QUESTIONS.slice(0, 3).map(q => (
                                <button key={q} className="alia-qbtn" onClick={() => sendMessage(q)}>{q}</button>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && <div className="alia-error">⚠️ {error}</div>}

                    {/* Input */}
                    <div className="alia-input-row">
                        <input
                            ref={inputRef}
                            className="alia-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                            placeholder="Ask any aviation doubt…"
                        />
                        <button
                            className="alia-send"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                        >
                            {loading ? '…' : '➤'}
                        </button>
                    </div>
                    <div className="alia-hint">Enter to send</div>
                </div>
            )}

            {/* ── FAB Button ── */}
            <button className="alia-fab" onClick={toggleOpen} aria-label="Open EduBot">
                <span className="fab-icon">{open ? '✕' : '🤖'}</span>
                {!open && <span className="fab-label">Ask EduBot</span>}
                {unread > 0 && !open && <span className="alia-badge">{unread}</span>}
            </button>
        </>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  /* FAB */
  .alia-fab {
    position: fixed; bottom: 24px; right: 24px;
    background: linear-gradient(135deg, #1d4ed8, #7c3aed);
    color: #fff; border: none; border-radius: 50px;
    padding: 12px 18px; cursor: pointer; z-index: 9999;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(29,78,216,0.45);
    font-family: inherit;
    transition: transform .2s, box-shadow .2s;
  }
  .alia-fab:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(29,78,216,0.55);
  }
  .fab-icon { font-size: 20px; }
  .fab-label { font-size: 13px; font-weight: 700; white-space: nowrap; }
  .alia-badge {
    position: absolute; top: -6px; right: -6px;
    background: #ef4444; color: #fff;
    width: 18px; height: 18px; border-radius: 50%;
    font-size: 10px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }

  /* Panel */
  .alia-panel {
    position: fixed; bottom: 90px; right: 24px;
    width: 360px; height: 500px;
    background: #0a0d14;
    border: 1px solid #1e293b;
    border-radius: 20px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.4);
    display: flex; flex-direction: column;
    z-index: 9998; overflow: hidden;
    animation: popUp .25s ease;
    font-family: 'Sora', 'Segoe UI', sans-serif;
  }
  @keyframes popUp {
    from { opacity: 0; transform: scale(0.93) translateY(12px); }
    to   { opacity: 1; transform: none; }
  }

  /* Header */
  .alia-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px;
    background: linear-gradient(90deg, #0a1628, #1d4ed8);
    flex-shrink: 0;
  }
  .alia-header-left  { display: flex; align-items: center; gap: 10px; }
  .alia-header-right { display: flex; align-items: center; gap: 6px; }
  .alia-avatar-sm {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg,#4f46e5,#0ea5e9);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .alia-name   { color: #fff; font-weight: 700; font-size: 13px; }
  .alia-status { color: #4ade80; font-size: 10px; font-weight: 600; }

  .tts-pill {
    padding: 3px 9px; border-radius: 20px; border: none;
    font-size: 13px; cursor: pointer; transition: all .2s;
  }
  .tts-on  { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; }
  .tts-off { background: #374151;   color: #6b7280; border: 1px solid #374151; }

  .icon-btn {
    background: none; border: none; color: #94a3b8;
    cursor: pointer; font-size: 14px; padding: 3px 6px;
    border-radius: 6px; transition: color .2s;
  }
  .icon-btn:hover { color: #e2e8f0; }
  .close-x:hover  { color: #f87171; }

  /* Messages */
  .alia-msgs {
    flex: 1; overflow-y: auto; padding: 12px;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin; scrollbar-color: #1e293b transparent;
  }
  .alia-msgs::-webkit-scrollbar { width: 3px; }
  .alia-msgs::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

  .alia-row {
    display: flex; gap: 7px; align-items: flex-end;
    animation: fadeUp .25s ease;
  }
  .bot-row  { flex-direction: row; }
  .user-row { flex-direction: row-reverse; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }

  .alia-av {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    background: linear-gradient(135deg,#0ea5e9,#6366f1); color: white;
  }
  .user-av { background: linear-gradient(135deg,#f59e0b,#ef4444); font-size: 11px; }

  .alia-bubble-wrap {
    display: flex; flex-direction: column; gap: 3px;
    align-items: flex-start; max-width: 80%;
  }
  .user-row .alia-bubble-wrap { align-items: flex-end; }

  .alia-bubble {
    padding: 9px 13px; border-radius: 14px;
    font-size: 13px; line-height: 1.6;
  }
  .bot-b {
    background: #111827; border: 1px solid #1e293b;
    border-bottom-left-radius: 3px; color: #cbd5e1;
  }
  .user-b {
    background: linear-gradient(135deg,#1d4ed8,#4f46e5);
    color: white; border-bottom-right-radius: 3px;
  }
  .err-b { background: #1c0a0a !important; border-color: #7f1d1d !important; }

  .alia-bubble strong { color: #93c5fd; }
  .alia-bubble em     { color: #a5b4fc; }
  .alia-bubble ul     { padding-left: 16px; margin: 6px 0; }
  .alia-bubble li     { margin: 3px 0; color: #94a3b8; font-size: 12px; }
  .alia-bubble p      { margin: 4px 0; }
  .alia-bubble p:first-child { margin-top: 0; }
  .alia-bubble p:last-child  { margin-bottom: 0; }

  /* Speak button */
  .mini-speak {
    background: none; border: 1px solid #1e293b;
    color: #4b5563; padding: 2px 8px; border-radius: 20px;
    font-size: 10px; cursor: pointer; transition: all .2s;
    font-family: inherit;
  }
  .mini-speak:hover  { border-color: #6366f1; color: #a5b4fc; }
  .mini-speak.speaking { border-color: #0ea5e9; color: #38bdf8; animation: blink 1.5s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* Typing */
  .alia-typing {
    background: #111827; border: 1px solid #1e293b;
    padding: 10px 14px; border-radius: 14px; border-bottom-left-radius: 3px;
    display: flex; gap: 4px; align-items: center;
  }
  .alia-typing span {
    width: 6px; height: 6px; border-radius: 50%; display: block;
    animation: bounce 1.2s infinite;
  }
  .alia-typing span:nth-child(1) { background: #4f46e5; }
  .alia-typing span:nth-child(2) { background: #0ea5e9; animation-delay: .2s; }
  .alia-typing span:nth-child(3) { background: #22c55e; animation-delay: .4s; }
  @keyframes bounce { 0%,60%,100%{transform:none} 30%{transform:translateY(-5px)} }

  /* Quick */
  .alia-quick {
    display: flex; flex-wrap: wrap; gap: 5px; padding: 0 12px 6px;
  }
  .alia-qbtn {
    background: #0f172a; border: 1px solid #1e293b; color: #64748b;
    padding: 4px 10px; border-radius: 20px; font-size: 11px;
    cursor: pointer; font-family: inherit; transition: all .2s;
  }
  .alia-qbtn:hover { border-color: #4f46e5; color: #a5b4fc; }

  /* Error */
  .alia-error {
    margin: 0 12px 6px;
    color: #f87171; font-size: 11px;
    padding: 5px 10px; background: #1c0a0a;
    border-radius: 6px; border-left: 3px solid #ef4444;
  }

  /* Input */
  .alia-input-row {
    display: flex; gap: 6px; padding: 10px 12px 6px;
    border-top: 1px solid #1e293b;
    background: #0d1117; flex-shrink: 0;
  }
  .alia-input {
    flex: 1; background: #111827; border: 1px solid #1e293b;
    color: #e2e8f0; padding: 8px 12px; border-radius: 10px;
    font-size: 13px; outline: none; font-family: inherit;
    transition: border-color .2s;
  }
  .alia-input:focus    { border-color: #4f46e5; }
  .alia-input::placeholder { color: #374151; }
  .alia-send {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg,#1d4ed8,#7c3aed);
    color: #fff; border: none; cursor: pointer; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    transition: opacity .2s; flex-shrink: 0;
  }
  .alia-send:disabled { opacity: .4; cursor: not-allowed; }
  .alia-send:hover:not(:disabled) { opacity: .85; }
  .alia-hint {
    text-align: center; font-size: 10px; color: #1e293b;
    padding-bottom: 8px; background: #0d1117;
  }

  @media (max-width: 420px) {
    .alia-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
    .fab-label  { display: none; }
    .alia-fab   { border-radius: 50%; padding: 14px; }
  }
`;