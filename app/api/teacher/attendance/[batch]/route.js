import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongoose';
import mongoose from 'mongoose';

function getCollection() {
    return mongoose.connection.db.collection('attendance');
}

export async function POST(request, { params }) {
    try {
        await connectDB();
        const body = await request.json();
        const batch = decodeURIComponent(params.batch); // ← from URL path
        const { date, records } = body;

        if (!date || !batch || !Array.isArray(records)) {
            return NextResponse.json({ error: 'Missing required fields: date, batch, records' }, { status: 400 });
        }

        const ops = records.map(r => ({
            updateOne: {
                filter: { date, batch, email: r.email },
                update: {
                    $set: {
                        date, batch,
                        email: r.email,
                        name: r.name,
                        status: r.status,
                        note: r.note || '',
                        updatedAt: new Date().toISOString(),
                    },
                },
                upsert: true,
            },
        }));

        await getCollection().bulkWrite(ops);
        return NextResponse.json({ success: true, saved: records.length });
    } catch (err) {
        console.error('[POST /api/teacher/attendance]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        await connectDB();
        const batch = decodeURIComponent(params.batch); // ← from URL path
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date'); // ← date still from query param

        if (!date || !batch) {
            return NextResponse.json({ error: 'Missing date or batch' }, { status: 400 });
        }

        const records = await getCollection().find({ date, batch }).toArray();
        return NextResponse.json({ records });
    } catch (err) {
        console.error('[GET /api/teacher/attendance]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}