import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongoose';
import { UserModel, ResultModel } from '../../../../lib/models';

export async function GET() {
    try {
        await connectDB();

        const users = await UserModel.find({}).lean();
        const results = await ResultModel.find({}).sort({ date: -1 }).lean();

        const resultsByEmail = results.reduce((acc, result) => {
            const email = result.userEmail.toLowerCase().trim();
            if (!acc[email]) acc[email] = [];
            acc[email].push({
                id: result._id.toString(),
                chapterId: result.chapterId,
                score: result.score,
                total: result.total,
                answers: result.answers || [],
                date: result.date,
                pct: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
            });
            return acc;
        }, {});

        const students = users.map(user => {
            const email = user.email.toLowerCase().trim();
            const userResults = resultsByEmail[email] || [];
            const scores = userResults.map(r => r.pct);
            const avgScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
            const bestScore = scores.length ? Math.max(...scores) : 0;
            const totalQuestions = userResults.reduce((sum, r) => sum + (r.total || 0), 0);

            return {
                name: user.name,
                email: user.email,
                phone: user.phone,
                joinedAt: user.joinedAt,
                testsAttempted: userResults.length,
                avgScore,
                bestScore,
                totalQuestions,
                results: userResults,
            };
        });

        const totalStudents = students.length;
        const totalTests = students.reduce((sum, student) => sum + student.testsAttempted, 0);
        const allScores = students.flatMap(student => student.results.map(result => result.pct));
        const avgAccuracy = allScores.length ? Math.round(allScores.reduce((sum, value) => sum + value, 0) / allScores.length) : 0;

        return NextResponse.json({
            summary: { totalStudents, totalTests, avgAccuracy },
            students,
        });
    } catch (err) {
        console.error('GET /api/teacher/students error:', err);
        return NextResponse.json({ error: 'Server error while fetching teacher data.' }, { status: 500 });
    }
}
