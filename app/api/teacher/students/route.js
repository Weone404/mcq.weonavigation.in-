import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
    try {
        // 1. Get all students
        const { rows: users } = await pool.query(`
            SELECT * FROM users ORDER BY created_at DESC
        `);

        // 2. Get all results
        const { rows: results } = await pool.query(`
            SELECT * FROM test_results ORDER BY date DESC
        `);

        // 2b. Get all assigned class test results too
        const { rows: assignedResults } = await pool.query(`
            SELECT r.*, t.title AS test_title, t.subject_label
            FROM assigned_test_results r
            JOIN assigned_tests t ON t.id = r.test_id
            ORDER BY r.submitted_at DESC
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
                source: 'normal',
            });
            return acc;
        }, {});

        const assignedResultsByEmail = assignedResults.reduce((acc, result) => {
            const email = result.student_email.toLowerCase().trim();
            if (!acc[email]) acc[email] = [];
            acc[email].push({
                id: `assigned-${result.id}`,
                chapterId: null,
                title: result.test_title,
                subjectLabel: result.subject_label,
                testId: result.test_id,
                score: result.score,
                total: result.total,
                answers: result.answers || [],
                date: result.submitted_at,
                pct: result.total > 0 
                    ? Math.round((result.score / result.total) * 100) 
                    : 0,
                source: 'assigned',
            });
            return acc;
        }, {});

        // 4. Build students array (exact same logic as before)
        const students = users.map(user => {
            const email = user.email.toLowerCase().trim();
            const userResults = resultsByEmail[email] || [];
            const assigned = assignedResultsByEmail[email] || [];
            const combinedResults = [...userResults, ...assigned].sort((a, b) => new Date(b.date) - new Date(a.date));
            const scores = combinedResults.map(r => r.pct);
            const avgScore = scores.length 
                ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) 
                : 0;
            const bestScore = scores.length ? Math.max(...scores) : 0;
            const totalQuestions = combinedResults.reduce((sum, r) => sum + (r.total || 0), 0);

            return {
                name: user.name,
                email: user.email,
                phone: user.phone,
                batch: user.batch,
                joinedAt: user.created_at,   // ← PostgreSQL: created_at not joined_at
                testsAttempted: combinedResults.length,
                avgScore,
                bestScore,
                totalQuestions,
                results: combinedResults,
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