// app/api/teacher/attendance/route.js
// POST  → save daily attendance records
// GET   → fetch attendance for a given date + batch

import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongoose'; // reuse your existing MongoDB client

export async function POST(request) {
    try {
        const body = await request.json();
        const { date, batch, records } = body;

        if (!date || !batch || !Array.isArray(records)) {
            return NextResponse.json({ error: 'Missing required fields: date, batch, records' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(); // uses your default DB from MONGODB_URI
        const collection = db.collection('attendance');

        // Upsert each student's record for this date+batch
        const ops = records.map(r => ({
            updateOne: {
                filter: { date, batch, email: r.email },
                update: {
                    $set: {
                        date,
                        batch,
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

        await collection.bulkWrite(ops);

        return NextResponse.json({ success: true, saved: records.length });
    } catch (err) {
        console.error('[POST /api/teacher/attendance]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const batch = searchParams.get('batch');

        if (!date || !batch) {
            return NextResponse.json({ error: 'Missing date or batch query param' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const records = await db.collection('attendance').find({ date, batch }).toArray();

        return NextResponse.json({ records });
    } catch (err) {
        console.error('[GET /api/teacher/attendance]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}