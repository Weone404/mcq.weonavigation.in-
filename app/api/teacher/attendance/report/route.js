import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const batch = searchParams.get('batch');
        const month = searchParams.get('month');

        if (!batch || !month) {
            return NextResponse.json({ error: 'Missing batch or month query param' }, { status: 400 });
        }

        const [year, mon] = month.split('-');
        const dateStart = `${year}-${mon}-01`;
        const lastDay = new Date(Number(year), Number(mon), 0).getDate();
        const dateEnd = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

        const collection = mongoose.connection.db.collection('attendance');

        const pipeline = [
            { $match: { batch, date: { $gte: dateStart, $lte: dateEnd } } },
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

        const rows = await collection.aggregate(pipeline).toArray();
        return NextResponse.json({ report: rows });
    } catch (err) {
        console.error('[GET /api/teacher/attendance/report]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}