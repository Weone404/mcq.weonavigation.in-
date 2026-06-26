import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function DELETE(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Remove the student from the users table
        const { rowCount } = await pool.query(
            `DELETE FROM users WHERE email = $1`,
            [email]
        );

        if (rowCount === 0) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Return the updated students list (same format as GET /api/teacher/students)
        const { rows: users } = await pool.query(
            `SELECT * FROM users ORDER BY created_at DESC`
        );

        const { rows: results } = await pool.query(
            `SELECT * FROM test_results ORDER BY date DESC`
        );

        const { rows: assignedResults } = await pool.query(`
            SELECT r.*, t.title AS test_title, t.subject_label
            FROM assigned_test_results r
            JOIN assigned_tests t ON t.id = r.test_id
            ORDER BY r.submitted_at DESC
        `);

        const resultsByEmail = results.reduce((acc, result) => {
            const key = result.student_email.toLowerCase().trim();
            if (!acc[key]) acc[key] = [];
            acc[key].push({
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
            const key = result.student_email.toLowerCase().trim();
            if (!acc[key]) acc[key] = [];
            acc[key].push({
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

        const students = users.map(user => {
            const key = user.email.toLowerCase().trim();
            const userResults = resultsByEmail[key] || [];
            const assigned = assignedResultsByEmail[key] || [];
            const combinedResults = [...userResults, ...assigned]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            const scores = combinedResults.map(r => r.pct);
            const avgScore = scores.length
                ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
                : 0;
            const bestScore = scores.length ? Math.max(...scores) : 0;
            const totalQuestions = combinedResults.reduce((sum, r) => sum + (r.total || 0), 0);

            return {
                name: user.name,
                email: user.email,
                phone: user.phone,
                batch: user.batch,
                joinedAt: user.created_at,
                testsAttempted: combinedResults.length,
                avgScore,
                bestScore,
                totalQuestions,
                results: combinedResults,
            };
        });

        return NextResponse.json({ students });

    } catch (err) {
        console.error('DELETE /api/teacher/students/remove error:', err);
        return NextResponse.json(
            { error: 'Failed to remove student' },
            { status: 500 }
        );
    }
}