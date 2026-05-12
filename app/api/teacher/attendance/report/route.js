// app/api/teacher/attendance/report/route.js
// GET ?batch=Batch+A+-+Morning&month=2025-05
// Returns per-student present/absent/late counts for the given month

import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongoose';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const batch = searchParams.get('batch');
        const month = searchParams.get('month'); // e.g. "2025-05"

        if (!batch || !month) {
            return NextResponse.json({ error: 'Missing batch or month query param' }, { status: 400 });
        }

        // month = "2025-05", so dates are "2025-05-01" … "2025-05-31"
        const [year, mon] = month.split('-');
        const dateStart = `${year}-${mon}-01`;
        const lastDay = new Date(Number(year), Number(mon), 0).getDate();
        const dateEnd = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

        const client = await clientPromise;
        const db = client.db();

        // Aggregate by email within the month range
        const pipeline = [
            {
                $match: {
                    batch,
                    date: { $gte: dateStart, $lte: dateEnd },
                },
            },
            {
                $group: {
                    _id: '$email',
                    name: { $first: '$name' },
                    email: { $first: '$email' },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                },
            },
            { $sort: { name: 1 } },
        ];

        const rows = await db.collection('attendance').aggregate(pipeline).toArray();

        const report = rows.map(r => ({
            email: r.email,
            name: r.name,
            present: r.present,
            absent: r.absent,
            late: r.late,
        }));

        return NextResponse.json({ report });
    } catch (err) {
        console.error('[GET /api/teacher/attendance/report]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}