"use client";
// components/DoubtChat.jsx
// Reusable AI Doubt Chat component — drop into any page

import { useState, useRef, useEffect } from "react";
import { askDoubt, pdfToBase64, formatAnswer, QUICK_QUESTIONS } from "../../lib/doubtApi";

export default function DoubtChat({ initialPdf = null, compact = false }) {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "👋 Hello! I'm **EduBot**, your DGCA study assistant.",
            id: Date.now(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfBase64, setPdfBase64] = useState(null);
    const [pdfName, setPdfName] = useState("");
    const [error, setError] = useState("");
    const [historyForApi, setHistoryForApi] = useState([]);

    const bottomRef = useRef(null);
    const fileRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // If a PDF is passed as prop (e.g. from lecture page)
    useEffect(() => {
        if (initialPdf) {
            handlePdfLoad(initialPdf);
        }
    }, [initialPdf]);

    async function handlePdfLoad(file) {
        try {
            const b64 = await pdfToBase64(file);
            setPdfBase64(b64);
            setPdfName(file.name);
            setPdfFile(file);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: `📄 PDF **"${file.name}"** loaded successfully!\n\nAsk me anything about this material. I'll answer based on the content of your PDF.`,
                    id: Date.now(),
                },
            ]);
        } catch {
            setError("Failed to read PDF. Please try again.");
        }
    }

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            setError("Please upload a valid PDF file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("PDF too large. Max size is 10MB.");
            return;
        }
        setError("");
        await handlePdfLoad(file);
    }

    async function sendMessage(questionText) {
        const q = (questionText || input).trim();
        if (!q || loading) return;

        setInput("");
        setError("");

        const userMsg = { role: "user", text: q, id: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const isFirstPdfMessage = pdfBase64 && historyForApi.length === 0;

            const { answer } = await askDoubt(
                q,
                isFirstPdfMessage ? pdfBase64 : null,
                historyForApi,
                isFirstPdfMessage ? "pdf" : "chat"
            );

            const botMsg = { role: "assistant", text: answer, id: Date.now() + 1 };
            setMessages((prev) => [...prev, botMsg]);

            // Update history for next API call
            setHistoryForApi((prev) => [
                ...prev,
                {
                    question: q,
                    answer,
                    ...(isFirstPdfMessage && { pdfBase64 }),
                },
            ]);
        } catch (err) {
            setError(err.message || "Something went wrong.");
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "⚠️ Sorry, I couldn't process that. Please try again.",
                    id: Date.now() + 1,
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function clearPdf() {
        setPdfBase64(null);
        setPdfFile(null);
        setPdfName("");
        setHistoryForApi([]);
        if (fileRef.current) fileRef.current.value = "";
    }

    function clearChat() {
        setMessages([
            {
                role: "assistant",
                text: "Ask Anything.",
                id: Date.now(),
            },
        ]);
        setHistoryForApi([]);
        setError("");
    }

    return (
        <div className={`doubt-chat-wrapper ${compact ? "compact" : ""}`}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .doubt-chat-wrapper {
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: ${compact ? "400px" : "calc(100vh - 80px)"};
          background: #0a0d14;
          color: #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }

        /* ── PDF Banner ── */
        .pdf-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: linear-gradient(90deg, #0f2027, #1a3a2a);
          border-bottom: 1px solid #1e4d35;
          font-size: 13px;
          flex-shrink: 0;
        }
        .pdf-badge {
          background: #22c55e22;
          border: 1px solid #22c55e55;
          color: #4ade80;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .pdf-name {
          color: #86efac;
          font-weight: 500;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pdf-clear-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        .pdf-clear-btn:hover { color: #f87171; }

        /* ── Messages ── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: #1e293b transparent;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

        .msg-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          animation: fadeSlideIn 0.3s ease;
        }
        .msg-row.user { flex-direction: row-reverse; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          font-weight: 600;
        }
        .avatar.bot {
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white;
        }
        .avatar.user-av {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: white;
        }

        .bubble {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.65;
        }
        .bubble.bot-bubble {
          background: #111827;
          border: 1px solid #1e293b;
          border-top-left-radius: 4px;
          color: #cbd5e1;
        }
        .bubble.bot-bubble.error-bubble {
          border-color: #7f1d1d;
          background: #1c0a0a;
        }
        .bubble.user-bubble {
          background: linear-gradient(135deg, #1d4ed8, #4f46e5);
          color: white;
          border-top-right-radius: 4px;
        }

        .bubble strong { color: #93c5fd; }
        .bubble em { color: #a5b4fc; font-style: italic; }
        .bubble ul { padding-left: 18px; margin: 8px 0; }
        .bubble li { margin: 4px 0; color: #94a3b8; }
        .bubble p { margin: 6px 0; }
        .bubble p:first-child { margin-top: 0; }
        .bubble p:last-child { margin-bottom: 0; }

        /* ── Typing indicator ── */
        .typing-bubble {
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 16px;
          border-top-left-radius: 4px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4f46e5;
          animation: bounce 1.2s infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; background: #0ea5e9; }
        .dot:nth-child(3) { animation-delay: 0.4s; background: #22c55e; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        /* ── Quick suggestions ── */
        .quick-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 16px 10px;
        }
        .quick-btn {
          background: #0f172a;
          border: 1px solid #1e293b;
          color: #64748b;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          white-space: nowrap;
        }
        .quick-btn:hover {
          border-color: #4f46e5;
          color: #a5b4fc;
          background: #1e1b4b22;
        }

        /* ── Input area ── */
        .input-area {
          padding: 12px 16px;
          border-top: 1px solid #1e293b;
          background: #0d1117;
          flex-shrink: 0;
        }
        .error-msg {
          color: #f87171;
          font-size: 12px;
          margin-bottom: 8px;
          padding: 6px 10px;
          background: #1c0a0a;
          border-radius: 6px;
          border-left: 3px solid #ef4444;
        }
        .input-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .input-box {
          flex: 1;
          background: #111827;
          border: 1px solid #1e293b;
          color: #e2e8f0;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Sora', sans-serif;
          resize: none;
          outline: none;
          min-height: 42px;
          max-height: 120px;
          transition: border-color 0.2s;
          line-height: 1.5;
        }
        .input-box:focus { border-color: #4f46e5; }
        .input-box::placeholder { color: #374151; }

        .action-btns {
          display: flex;
          gap: 6px;
        }
        .send-btn {
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          border: none;
          color: white;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-family: 'Sora', sans-serif;
          white-space: nowrap;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pdf-upload-btn {
          background: #111827;
          border: 1px dashed #374151;
          color: #6b7280;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .pdf-upload-btn:hover {
          border-color: #22c55e;
          color: #4ade80;
        }

        .clear-btn {
          background: none;
          border: 1px solid #1e293b;
          color: #475569;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .clear-btn:hover { border-color: #475569; color: #94a3b8; }

        .footer-hint {
          margin-top: 8px;
          font-size: 11px;
          color: #374151;
          text-align: center;
        }

        .doubt-chat-wrapper.compact .messages-area { min-height: 200px; }
      `}</style>

            {/* PDF Banner */}
            {pdfName && (
                <div className="pdf-banner">
                    <span className="pdf-badge">📄 PDF</span>
                    <span className="pdf-name">{pdfName}</span>
                    <button className="pdf-clear-btn" onClick={clearPdf} title="Remove PDF">✕</button>
                </div>
            )}

            {/* Messages */}
            <div className="messages-area">
                {messages.map((msg) => (
                    <div key={msg.id} className={`msg-row ${msg.role === "user" ? "user" : "bot"}`}>
                        <div className={`avatar ${msg.role === "user" ? "user-av" : "bot"}`}>
                            {msg.role === "user" ? "S" : "🤖"}
                        </div>
                        <div
                            className={`bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"} ${msg.isError ? "error-bubble" : ""}`}
                            dangerouslySetInnerHTML={{ __html: formatAnswer(msg.text) }}
                        />
                    </div>
                ))}

                {loading && (
                    <div className="msg-row bot">
                        <div className="avatar bot">🤖</div>
                        <div className="typing-bubble">
                            <div className="dot" />
                            <div className="dot" />
                            <div className="dot" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick suggestion buttons */}
            {messages.length <= 2 && (
                <div className="quick-btns">
                    {QUICK_QUESTIONS.map((q) => (
                        <button key={q} className="quick-btn" onClick={() => sendMessage(q)}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="input-area">
                {error && <div className="error-msg">⚠️ {error}</div>}
                <div className="input-row">
                    <textarea
                        ref={inputRef}
                        className="input-box"
                        placeholder={pdfName ? `Ask about "${pdfName}"...` : "Ask any doubt or aviation question..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        rows={1}
                    />
                    <div className="action-btns">
                        {!pdfName && (
                            <>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="application/pdf"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
                                <button className="pdf-upload-btn" onClick={() => fileRef.current?.click()}>
                                    📎 PDF
                                </button>
                            </>
                        )}
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
                <div className="footer-hint">Press Enter to send · Shift+Enter for new line</div>
            </div>
        </div>
    );
}