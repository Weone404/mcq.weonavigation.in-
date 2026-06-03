import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
    try {
        // 1. Get all students
        const { rows: users } = await pool.query(`
            SELECT * FROM students ORDER BY joined_at DESC
        `);

        // 2. Get all results
        const { rows: results } = await pool.query(`
            SELECT * FROM test_results ORDER BY date DESC
        `);

        // 3. Group results by email (same logic as your MongoDB code)
        const resultsByEmail = results.reduce((acc, result) => {
            const email = result.student_email.toLowerCase().trim();
            if (!acc[email]) acc[email] = [];
            acc[email].push({
                id: result.id.toString(),
                chapterId: result.chapter_id,
                score: result.score,
                total: result.total,
                answers: result.answers || [],
                date: result.date,
                pct: result.total > 0 
                    ? Math.round((result.score / result.total) * 100) 
                    : 0,
            });
            return acc;
        }, {});

        // 4. Build students array (exact same logic as before)
        const students = users.map(user => {
            const email = user.email.toLowerCase().trim();
            const userResults = resultsByEmail[email] || [];
            const scores = userResults.map(r => r.pct);
            const avgScore = scores.length 
                ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) 
                : 0;
            const bestScore = scores.length ? Math.max(...scores) : 0;
            const totalQuestions = userResults.reduce((sum, r) => sum + (r.total || 0), 0);

            return {
                name: user.name,
                email: user.email,
                phone: user.phone,
                batch: user.batch,
                joinedAt: user.joined_at,   // ← only change: MongoDB joinedAt → PG joined_at
                testsAttempted: userResults.length,
                avgScore,
                bestScore,
                totalQuestions,
                results: userResults,
            };
        });

        // 5. Summary (exact same logic as before)
        const totalStudents = students.length;
        const totalTests = students.reduce((sum, s) => sum + s.testsAttempted, 0);
        const allScores = students.flatMap(s => s.results.map(r => r.pct));
        const avgAccuracy = allScores.length 
            ? Math.round(allScores.reduce((sum, v) => sum + v, 0) / allScores.length) 
            : 0;

        return NextResponse.json({
            summary: { totalStudents, totalTests, avgAccuracy },
            students,
        });

    } catch (err) {
        console.error('GET /api/teacher/students error:', err);
        return NextResponse.json(
            { error: 'Server error while fetching teacher data.' }, 
            { status: 500 }
        );
    }
}