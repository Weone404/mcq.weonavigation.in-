'use client';
import { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_ALIA_API_URL;

export default function AliaWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! I'm Alia ✈️ Ask me anything from your aviation course books." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const msgsRef = useRef(null);

    useEffect(() => {
        if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const query = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/v1/query/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: 'web_user',
                    query
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'bot', text: data.answer || data.response || 'No answer received.' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Could not connect. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {open && (
                <div style={styles.panel}>
                    <div style={styles.header}>
                        <span>✈️ Alia — Aviation AI</span>
                        <button onClick={() => setOpen(false)} style={styles.closeBtn}>✕</button>
                    </div>
                    <div ref={msgsRef} style={styles.msgs}>
                        {messages.map((m, i) => (
                            <div key={i} style={m.role === 'user' ? styles.userMsg : styles.botMsg}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div style={styles.botMsg}>…</div>}
                    </div>
                    <div style={styles.inputRow}>
                        <input
                            style={styles.input}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask a question…"
                        />
                        <button onClick={sendMessage} style={styles.sendBtn}>➤</button>
                    </div>
                </div>
            )}

            <button onClick={() => setOpen(o => !o)} style={styles.fab} aria-label="Open aviation assistant">
                ✈️
            </button>
        </>
    );
}

const styles = {
    fab: {
        position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, borderRadius: '50%',
        background: '#1a56db', color: '#fff', fontSize: 22, border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.2)', zIndex: 9999
    },
    panel: {
        position: 'fixed', bottom: 90, right: 24, width: 340, height: 440, background: '#fff',
        borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex',
        flexDirection: 'column', zIndex: 9998, overflow: 'hidden'
    },
    header: {
        background: '#1a56db', color: '#fff', padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 500
    },
    closeBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 },
    msgs: { flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
    botMsg: {
        background: '#f1f5f9', padding: '8px 12px', borderRadius: 14, fontSize: 13,
        maxWidth: '85%', alignSelf: 'flex-start', lineHeight: 1.5
    },
    userMsg: {
        background: '#1a56db', color: '#fff', padding: '8px 12px', borderRadius: 14,
        fontSize: 13, maxWidth: '85%', alignSelf: 'flex-end', lineHeight: 1.5
    },
    inputRow: { display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #e2e8f0' },
    input: { flex: 1, border: '1px solid #e2e8f0', borderRadius: 20, padding: '8px 14px', fontSize: 13, outline: 'none' },
    sendBtn: { width: 32, height: 32, borderRadius: '50%', background: '#1a56db', color: '#fff', border: 'none', cursor: 'pointer' }
};