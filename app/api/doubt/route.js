// app/api/doubt/route.js
// v4 - NO model caching, tries every model fresh each time

import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are EduBot, an expert DGCA exam tutor. Answer aviation questions clearly, use bullet points, be encouraging, end with a memory tip.`;

// Hardcoded from your available models list — lite/smaller models first (lower quota usage)
const MODELS_TO_TRY = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
];

export async function POST(request) {
    try {
        const body = await request.json();
        const { pdfBase64, history = [], mode = "chat" } = body;
        const question = body.question != null ? String(body.question).trim() : "";

        if (!question) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY not set in .env.local" }, { status: 500 });
        }

        // Build contents array
        const contents = [];
        for (const turn of history) {
            const uParts = [];
            if (turn.pdfBase64) uParts.push({ inlineData: { mimeType: "application/pdf", data: turn.pdfBase64 } });
            uParts.push({ text: String(turn.question || "") });
            contents.push({ role: "user", parts: uParts });
            contents.push({ role: "model", parts: [{ text: String(turn.answer || "") }] });
        }

        const curParts = [];
        if (pdfBase64 && mode === "pdf") {
            curParts.push({ inlineData: { mimeType: "application/pdf", data: pdfBase64 } });
            curParts.push({ text: `Answer this question based on the PDF:\n${question}` });
        } else {
            curParts.push({ text: question });
        }
        contents.push({ role: "user", parts: curParts });

        const payload = {
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        };

        // Try every model — NO caching
        for (const model of MODELS_TO_TRY) {
            console.log(`[EduBot] Trying ${model}...`);

            let res, data;
            try {
                res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
                );
                data = await res.json();
            } catch (fetchErr) {
                console.warn(`[EduBot] Fetch error for ${model}:`, fetchErr.message);
                continue;
            }

            if (res.ok) {
                const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("\n");
                if (answer) {
                    console.log(`[EduBot] ✓ Got answer from ${model}`);
                    return NextResponse.json({ answer, model });
                }
            }

            const errStatus = data?.error?.status;
            console.warn(`[EduBot] ✗ ${model} → ${errStatus || res.status}`);

            if (errStatus === "RESOURCE_EXHAUSTED") continue; // try next
            if (errStatus === "NOT_FOUND") continue;          // try next
            if (errStatus === "INVALID_ARGUMENT") {
                return NextResponse.json({ error: "PDF too large. Try a smaller file." }, { status: 400 });
            }
            // Unknown error — still try next model
        }

        return NextResponse.json({
            error: "All free Gemini models are quota-exhausted right now. Quotas reset daily — try again in a few hours, or create a new API key at https://aistudio.google.com/app/apikey",
        }, { status: 429 });

    } catch (err) {
        console.error("[EduBot] Unexpected error:", err);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}