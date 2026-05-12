import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RtrAttempt from '@/models/RtrAttempt';
import { scoreSession } from '@/lib/rtr/scorer';
import { getScenarioById } from '@/lib/rtr/scenarios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { scenarioId, mode, transcripts } = body;

        if (!scenarioId || !transcripts || !Array.isArray(transcripts)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const scenario = getScenarioById(scenarioId);
        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        const rawTranscripts = transcripts.map((t) => t.transcript || '');
        const scored = scoreSession(rawTranscripts, scenario);

        const attempt = await RtrAttempt.create({
            userId: session.user.id,
            mode: mode || 'practice',
            scenarioId,
            callsign: scenario.callsign,
            departure: scenario.departure,
            destination: scenario.destination,
            phases: scored.phases.map((p, i) => ({
                ...p,
                timeTaken: transcripts[i]?.timeTaken || 0,
            })),
            totalScore: scored.totalScore,
            maxTotalScore: scored.maxTotalScore,
            percentage: scored.percentage,
            passed: scored.passed,
            examinerRemarks: scored.examinerRemarks,
            duration: body.duration || 0,
        });

        return NextResponse.json({
            success: true,
            attemptId: attempt._id,
            result: scored,
        });
    } catch (err) {
        console.error('RTR attempt error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const attempts = await RtrAttempt.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return NextResponse.json({ attempts });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}