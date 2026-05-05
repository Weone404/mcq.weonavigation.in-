"use client";

import { useEffect, useState } from "react";
// ✅ Fix both imports
import DoubtAgent from '@/components/DoubtAgent.jsx';
import { askDoubt, askDoubtVoice, buildAudioUrl } from '@/lib/doubtApi.js';

export default function DoubtPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSubjects()
            .then(setSubjects)
            .catch(() => setSubjects([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ padding: "24px", maxWidth: "860px", margin: "0 auto", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    ✈️ Doubt Resolution
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px", marginBottom: 0 }}>
                    Ask any DGCA exam doubt — get instant AI answers with audio playback.
                </p>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                {loading ? (
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading subjects…</p>
                ) : (
                    <DoubtAgent subjects={subjects} studentId="guest" />
                )}
            </div>
        </div>
    );
}