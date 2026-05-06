"use client";
// app/doubt/page.jsx
// AI Doubt Solver Page — fits into the dgca-mcq project

import { useState } from "react";
import DoubtChat from "../../../components/DoubtChat/page.jsx";

const TOPICS = [
    { label: "Air Regulations", icon: "📜", color: "#6366f1" },
    { label: "Navigation", icon: "🧭", color: "#0ea5e9" },
    { label: "Meteorology", icon: "🌤️", color: "#f59e0b" },
    { label: "Technical General", icon: "⚙️", color: "#22c55e" },
    { label: "Air Frames", icon: "✈️", color: "#a855f7" },
    { label: "Engines", icon: "🔧", color: "#ef4444" },
];

export default function DoubtPage() {
    const [activeTopic, setActiveTopic] = useState(null);

    return (
        <div style={styles.page}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #060810; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

        .topic-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #0d1117;
          border: 1px solid #1e293b;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: #94a3b8;
          text-align: left;
          width: 100%;
        }
        .topic-card:hover, .topic-card.active {
          background: #111827;
          border-color: #374151;
          color: #e2e8f0;
          transform: translateX(2px);
        }
        .topic-icon {
          font-size: 18px;
          width: 28px;
          text-align: center;
        }

        .stat-card {
          background: #0d1117;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-label {
          font-size: 11px;
          color: #475569;
          margin-top: 2px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .layout { flex-direction: column !important; }
          .sidebar { width: 100% !important; min-width: unset !important; }
          .topics-row { flex-direction: row !important; flex-wrap: wrap; }
          .topic-card { width: auto !important; flex: 1; min-width: 130px; }
        }
      `}</style>

            {/* ── Header ── */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.logo}>🤖</div>
                    <div>
                        <h1 style={styles.title}>EduBot — Doubt Solver</h1>
                        <p style={styles.subtitle}>AI-powered tutor for your DGCA exam prep</p>
                    </div>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.liveBadge}>
                        <span style={styles.liveDot} />
                        AI Online
                    </span>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="layout" style={styles.layout}>

                {/* ── Left Sidebar ── */}
                <div className="sidebar" style={styles.sidebar}>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                        <div className="stat-card">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Available</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">∞</div>
                            <div className="stat-label">Questions</div>
                        </div>
                    </div>

                    {/* Topics */}
                    <div style={styles.sideSection}>
                        <p style={styles.sideLabel}>📚 DGCA Topics</p>
                        <div className="topics-row" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {TOPICS.map((t) => (
                                <button
                                    key={t.label}
                                    className={`topic-card ${activeTopic === t.label ? "active" : ""}`}
                                    onClick={() => setActiveTopic(t.label === activeTopic ? null : t.label)}
                                >
                                    <span className="topic-icon">{t.icon}</span>
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div style={styles.tipBox}>
                        <p style={styles.tipTitle}>💡 Tips</p>
                        <ul style={styles.tipList}>
                            <li>Upload a chapter PDF for targeted answers</li>
                            <li>Ask follow-up questions naturally</li>
                            <li>Request practice questions from any topic</li>
                            <li>Ask for simple analogies to complex topics</li>
                        </ul>
                    </div>
                </div>

                {/* ── Chat Area ── */}
                <div style={styles.chatContainer}>
                    <DoubtChat />
                </div>

            </div>
        </div>
    );
}

const styles = {
    page: {
        fontFamily: "'Sora', sans-serif",
        background: "#060810",
        minHeight: "100vh",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid #1e293b",
        background: "#0a0d14",
        flexShrink: 0,
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
    },
    logo: {
        width: "44px",
        height: "44px",
        background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
    },
    title: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#f1f5f9",
    },
    subtitle: {
        fontSize: "12px",
        color: "#475569",
        marginTop: "2px",
    },
    headerRight: {},
    liveBadge: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "#0d1a0d",
        border: "1px solid #1a4d1a",
        color: "#4ade80",
        padding: "5px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "500",
    },
    liveDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 6px #22c55e",
        animation: "pulse 2s infinite",
    },
    layout: {
        display: "flex",
        flex: 1,
        gap: "0",
        overflow: "hidden",
        height: "calc(100vh - 77px)",
    },
    sidebar: {
        width: "240px",
        minWidth: "220px",
        padding: "20px 16px",
        borderRight: "1px solid #1e293b",
        background: "#07090f",
        overflowY: "auto",
    },
    sideSection: {
        marginBottom: "20px",
    },
    sideLabel: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#374151",
        letterSpacing: "1px",
        textTransform: "uppercase",
        marginBottom: "10px",
    },
    tipBox: {
        background: "#0d1117",
        border: "1px solid #1e293b",
        borderRadius: "10px",
        padding: "14px",
    },
    tipTitle: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#f59e0b",
        marginBottom: "10px",
    },
    tipList: {
        paddingLeft: "16px",
        fontSize: "12px",
        color: "#475569",
        lineHeight: "1.9",
    },
    chatContainer: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
};