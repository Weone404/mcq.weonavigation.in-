import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// ── GET: students fetch all upcoming classes ──────────────────────────────────
export async function GET() {
    try {
        const now = new Date().toISOString();

        const { rows } = await pool.query(
            `SELECT
                id,
                title,
                description,
                start_date_time  AS "startDateTime",
                end_date_time    AS "endDateTime",
                meet_link        AS "meetLink",
                batch,
                created_at       AS "createdAt"
             FROM live_classes
             WHERE end_date_time >= $1
             ORDER BY start_date_time ASC`,
            [now]
        );

        return NextResponse.json({ success: true, events: rows });
    } catch (err) {
        console.error('GET /api/classes error:', err.message);
        return NextResponse.json({ success: false, events: [], error: err.message });
    }
}

// ── POST: teacher creates a new class ────────────────────────────────────────
export async function POST(request) {
    try {
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

        const { rows } = await pool.query(
            `INSERT INTO live_classes (title, description, start_date_time, end_date_time, meet_link, batch)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING
                id,
                title,
                description,
                start_date_time  AS "startDateTime",
                end_date_time    AS "endDateTime",
                meet_link        AS "meetLink",
                batch,
                created_at       AS "createdAt"`,
            [
                title.trim(),
                (description || '').trim(),
                startDateTime.toISOString(),
                endDateTime.toISOString(),
                meetLink.trim(),
                batch || 'All Batches',
            ]
        );

        const newClass = rows[0];
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
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing class id' },
                { status: 400 }
            );
        }

        const { rowCount } = await pool.query(
            `DELETE FROM live_classes WHERE id = $1`,
            [id]
        );

        if (rowCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Class not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/classes error:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}