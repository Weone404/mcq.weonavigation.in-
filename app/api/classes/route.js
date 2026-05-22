import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongoose';
import mongoose from 'mongoose';

// ── Mongoose Schema for Live Classes ─────────────────────────────────────────
const classSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    meetLink: { type: String, required: true },
    batch: { type: String, default: 'All Batches' },
    createdAt: { type: Date, default: Date.now },
});

// Avoid model re-registration during hot reload in dev
const LiveClass = mongoose.models.LiveClass || mongoose.model('LiveClass', classSchema);

// ── GET: students fetch all upcoming classes ──────────────────────────────────
export async function GET() {
    try {
        await connectDB();

        const now = new Date();
        const classes = await LiveClass
            .find({ endDateTime: { $gte: now } })
            .sort({ startDateTime: 1 })
            .lean();

        return NextResponse.json({ success: true, events: classes });
    } catch (err) {
        console.error('GET /api/classes error:', err.message);
        return NextResponse.json({ success: false, events: [], error: err.message });
    }
}

// ── POST: teacher creates a new class ────────────────────────────────────────
export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { title, description, date, time, duration, meetLink, batch } = body;

        // Validate required fields
        if (!title || !date || !time || !meetLink) {
            return NextResponse.json(
                { success: false, error: 'Title, date, time and meetLink are required' },
                { status: 400 }
            );
        }

        // Validate meetLink is a real URL
        try { new URL(meetLink); } catch {
            return NextResponse.json(
                { success: false, error: 'Please enter a valid meeting link (must start with https://)' },
                { status: 400 }
            );
        }

        // Build start and end times (IST = +05:30)
        const startDateTime = new Date(`${date}T${time}:00+05:30`);
        if (isNaN(startDateTime.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid date or time' },
                { status: 400 }
            );
        }

        const durationMins = parseInt(duration) || 60;
        const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

        const newClass = await LiveClass.create({
            title: title.trim(),
            description: (description || '').trim(),
            startDateTime,
            endDateTime,
            meetLink: meetLink.trim(),
            batch: batch || 'All Batches',
        });

        console.log('Class scheduled:', newClass.title, 'at', newClass.startDateTime);

        return NextResponse.json({ success: true, event: newClass });
    } catch (err) {
        console.error('POST /api/classes error:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── DELETE: teacher removes a class ──────────────────────────────────────────
export async function DELETE(request) {
    try {
        await connectDB();

        const { id } = await request.json();
        await LiveClass.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/classes error:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}