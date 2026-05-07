// app/api/doubt/route.js
// AI Doubt Solver — powered by Groq (FREE, no daily quota, ultra fast)
// Model: llama-3.3-70b-versatile — smart & free on Groq

import { NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are EduBot, an expert academic tutor for DGCA (Directorate General of Civil Aviation) exam preparation. You help students understand aviation concepts, regulations, and theory.

Your behavior:
- Answer clearly and concisely in a student-friendly tone
- Break down complex aviation topics into simple explanations
- Use bullet points for multi-part explanations
- Be encouraging and supportive
- End with a helpful memory tip when relevant
- If a question is outside aviation scope, gently redirect

Format: Direct answer → Explanation → Key bullet points → Memory tip`;

export async function POST(request) {
    try {
        const body = await request.json();
        const { history = [] } = body;

        const question = body.question != null ? String(body.question).trim() : "";

        if (!question) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GROQ_API_KEY not set in .env.local — get your free key at https://console.groq.com/keys" },
                { status: 500 }
            );
        }

        // ── Build messages array (OpenAI-compatible format) ──────────────────────
        const messages = [
            { role: "system", content: SYSTEM_PROMPT }
        ];

        // Add conversation history
        for (const turn of history) {
            messages.push({ role: "user", content: String(turn.question || "") });
            messages.push({ role: "assistant", content: String(turn.answer || "") });
        }

        // Add current question
        messages.push({ role: "user", content: question });

        // ── Call Groq API ─────────────────────────────────────────────────────────
        console.log(`[EduBot] Calling Groq with ${messages.length} messages...`);

        const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages,
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.9,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("[EduBot] Groq error:", JSON.stringify(data));

            const errType = data?.error?.type;
            const errMsg = data?.error?.message || "";

            if (errType === "rate_limit_exceeded" || res.status === 429) {
                return NextResponse.json(
                    { error: "Rate limit hit. Please wait a few seconds and try again." },
                    { status: 429 }
                );
            }
            if (res.status === 401) {
                return NextResponse.json(
                    { error: "Invalid GROQ_API_KEY. Check your .env.local file." },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                { error: errMsg || "AI error. Please try again." },
                { status: 500 }
            );
        }

        const answer = data?.choices?.[0]?.message?.content;

        if (!answer) {
            return NextResponse.json(
                { error: "No response from AI. Please try again." },
                { status: 500 }
            );
        }

        console.log(`[EduBot] ✓ Got answer (${answer.length} chars)`);
        return NextResponse.json({ answer });

    } catch (error) {
        console.error("[EduBot] Unexpected error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}