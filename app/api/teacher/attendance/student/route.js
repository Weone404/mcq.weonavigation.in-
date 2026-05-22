import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Missing email query param' }, { status: 400 });
        }

        const collection = mongoose.connection.db.collection('attendance');

        const now = new Date();
        const year = now.getFullYear();
        const mon = String(now.getMonth() + 1).padStart(2, '0');
        const dateStart = `${year}-${mon}-01`;
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        const dateEnd = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

        const monthRecords = await collection
            .find({ email, date: { $gte: dateStart, $lte: dateEnd } })
            .toArray();

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