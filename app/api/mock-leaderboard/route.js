import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongoose';
import mongoose from 'mongoose';

// ─── Inline schema (separate collection from the chapter leaderboard) ──────────
const MockLeaderboardSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    subject: { type: String, required: true, default: 'all' },
    subjectLabel: { type: String, default: 'All Subjects' },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    attempts: { type: Number, default: 1 },
    submittedAt: { type: String },
    firstAttempt: { type: String },
});

// Compound index: one best-score doc per student per subject
MockLeaderboardSchema.index({ email: 1, subject: 1 }, { unique: true });

const MockLeaderboard = mongoose.models.MockLeaderboard
    || mongoose.model('MockLeaderboard', MockLeaderboardSchema);

// ─── GET /api/mock-leaderboard?subject=air_regulations ────────────────────────
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');

        const query = subject && subject !== 'all' ? { subject } : {};

        const entries = await MockLeaderboard
            .find(query)
            .sort({ accuracy: -1, score: -1, submittedAt: 1 })
            .limit(100)
            .lean();

        return NextResponse.json({
            success: true,
            entries: entries.map(e => ({
                email: e.email,
                name: e.name,
                subject: e.subject,
                subjectLabel: e.subjectLabel,
                score: e.score,
                total: e.total,
                accuracy: e.accuracy,
                attempts: e.attempts,
                submittedAt: e.submittedAt,
            })),
        });
    } catch (err) {
        console.error('GET /api/mock-leaderboard error:', err);
        return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
    }
}

// ─── POST /api/mock-leaderboard ───────────────────────────────────────────────
// Only saves if new accuracy is better than existing best
export async function POST(request) {
    try {
        await connectDB();

        const { email, name, subject, subjectLabel, score, total, accuracy, submittedAt } = await request.json();

        if (!email || !name || score == null || !total) {
            return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
        }

        const cleanEmail = email.toLowerCase().trim();
        const subjectKey = subject || 'all';
        const newAccuracy = accuracy ?? (total > 0 ? Math.round((score / total) * 100) : 0);

        const existing = await MockLeaderboard.findOne({ email: cleanEmail, subject: subjectKey });

        if (existing) {
            if (existing.accuracy >= newAccuracy) {
                // Already have a better or equal score — just increment attempts
                existing.attempts += 1;
                await existing.save();
                return NextResponse.json({ success: true, updated: false, message: 'Existing score is better.' });
            }
            // New score is better — update it
            existing.name = name;
            existing.subjectLabel = subjectLabel || subjectKey;
            existing.score = Number(score);
            existing.total = Number(total);
            existing.accuracy = newAccuracy;
            existing.attempts += 1;
            existing.submittedAt = submittedAt || new Date().toISOString();
            await existing.save();
            return NextResponse.json({ success: true, updated: true });
        }

        // First attempt — create new doc
        await MockLeaderboard.create({
            email: cleanEmail,
            name,
            subject: subjectKey,
            subjectLabel: subjectLabel || subjectKey,
            score: Number(score),
            total: Number(total),
            accuracy: newAccuracy,
            attempts: 1,
            submittedAt: submittedAt || new Date().toISOString(),
            firstAttempt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, updated: true, created: true });
    } catch (err) {
        console.error('POST /api/mock-leaderboard error:', err);
        return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
    }
}