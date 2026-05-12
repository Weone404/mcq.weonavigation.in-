// app/api/teacher/attendance/student/route.js
// GET ?email=student@example.com
// Returns current-month summary + calendar day map + recent 10 sessions

import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongoose';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email query param' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection('attendance');

        // Current month range
        const now = new Date();
        const year = now.getFullYear();
        const mon = String(now.getMonth() + 1).padStart(2, '0');
        const dateStart = `${year}-${mon}-01`;
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        const dateEnd = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

        // This month's records for the student
        const monthRecords = await collection
            .find({ email, date: { $gte: dateStart, $lte: dateEnd } })
            .toArray();

        // Build calendar day map: { "2025-05-01": "present", ... }
        const days = {};
        let present = 0, absent = 0, late = 0;
        for (const r of monthRecords) {
            days[r.date] = r.status;
            if (r.status === 'present') present++;
            else if (r.status === 'absent') absent++;
            else if (r.status === 'late') late++;
        }

        const total = present + absent + late;
        const monthPct = total > 0 ? Math.round((present / total) * 100) : 0;

        // Recent 10 sessions (all-time, sorted newest first)
        const recentDocs = await collection
            .find({ email })
            .sort({ date: -1 })
            .limit(10)
            .toArray();

        const recent = recentDocs.map(r => ({
            date: r.date,
            batch: r.batch,
            status: r.status,
            note: r.note || '',
        }));

        return NextResponse.json({ present, absent, late, monthPct, days, recent });
    } catch (err) {
        console.error('[GET /api/teacher/attendance/student]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}