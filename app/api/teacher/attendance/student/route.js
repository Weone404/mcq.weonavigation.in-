import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email query param' }, { status: 400 });
        }

        const emailNormalized = email.toLowerCase().trim();
        const now = new Date();
        const year = now.getFullYear();
        const mon = String(now.getMonth() + 1).padStart(2, '0');
        const dateStart = `${year}-${mon}-01`;
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        const dateEnd = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

        const { rows: monthRecords } = await pool.query(
            `SELECT date, status, batch, note FROM attendance
             WHERE LOWER(student_email) = LOWER($1)
               AND date >= $2
               AND date <= $3
             ORDER BY date ASC`,
            [emailNormalized, dateStart, dateEnd]
        );

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

        const { rows: recentDocs } = await pool.query(
            `SELECT date, batch, status, note FROM attendance
             WHERE LOWER(student_email) = LOWER($1)
             ORDER BY date DESC
             LIMIT 10`,
            [emailNormalized]
        );

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
