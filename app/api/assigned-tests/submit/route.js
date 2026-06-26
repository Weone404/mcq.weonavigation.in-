import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS assigned_test_results (
            id              SERIAL PRIMARY KEY,
            test_id         INTEGER NOT NULL,
            student_email   TEXT NOT NULL,
            student_name    TEXT NOT NULL,
            score           INTEGER NOT NULL,
            total           INTEGER NOT NULL,
            accuracy        INTEGER NOT NULL,
            answers         JSONB DEFAULT '[]',
            submitted_at    TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_atr_test_id ON assigned_test_results(test_id);
        CREATE INDEX IF NOT EXISTS idx_atr_email ON assigned_test_results(student_email);
    `);
}

// POST — student submits assigned test result
export async function POST(request) {
    try {
        await ensureTable();
        const body = await request.json();
        const { testId, studentEmail, studentName, score, total, answers } = body;

        if (!testId || !studentEmail || score == null || total == null) {
            return NextResponse.json(
                { success: false, error: 'testId, studentEmail, score, total are required' },
                { status: 400 }
            );
        }

        const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
        const parsedTestId = parseInt(testId, 10);

        console.log('📝 [POST /api/assigned-tests/submit] Storing result:', {
            testId: parsedTestId,
            studentEmail: studentEmail.toLowerCase().trim(),
            studentName,
            score,
            total,
            accuracy,
        });

        const { rows } = await pool.query(
            `INSERT INTO assigned_test_results 
                (test_id, student_email, student_name, score, total, accuracy, answers)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                parsedTestId,
                studentEmail.toLowerCase().trim(),
                studentName || '',
                score,
                total,
                accuracy,
                JSON.stringify(answers || []),
            ]
        );

        console.log('✅ [POST] Result stored with ID:', rows[0]?.id);
        return NextResponse.json({ success: true, result: rows[0] });
    } catch (err) {
        console.error('❌ POST /api/assigned-tests/submit error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// GET — teacher fetches results for a specific test
export async function GET(request) {
    try {
        await ensureTable();
        const { searchParams } = new URL(request.url);
        const testId = searchParams.get('testId');

        if (!testId) {
            return NextResponse.json({ success: false, error: 'testId is required' }, { status: 400 });
        }

        const parsedTestId = parseInt(testId, 10);
        
        console.log('🔍 [GET /api/assigned-tests/submit] Fetching results for testId:', parsedTestId);

        const { rows } = await pool.query(
            `SELECT 
                r.*,
                t.title     AS test_title,
                t.subject_label
             FROM assigned_test_results r
             JOIN assigned_tests t ON t.id = r.test_id
             WHERE r.test_id = $1
             ORDER BY r.submitted_at DESC`,
            [parsedTestId]
        );

        console.log(`✅ [GET] Found ${rows.length} result(s) for testId ${parsedTestId}`);
        if (rows.length === 0) {
            console.log('⚠️  No results found. Checking if test exists...');
            const testCheck = await pool.query(
                'SELECT id, title FROM assigned_tests WHERE id = $1',
                [parsedTestId]
            );
            if (testCheck.rows.length > 0) {
                console.log('✓ Test exists:', testCheck.rows[0]);
                // Check if ANY results exist in the table at all
                const totalCheck = await pool.query(
                    'SELECT COUNT(*) as total FROM assigned_test_results'
                );
                console.log(`📊 Total records in assigned_test_results: ${totalCheck.rows[0]?.total || 0}`);
                if (totalCheck.rows[0]?.total === 0) {
                    console.log('💡 Possible cause: No students have submitted any assigned tests yet');
                }
            } else {
                console.log('✗ Test NOT FOUND in database');
            }
        }

        return NextResponse.json({ success: true, results: rows });
    } catch (err) {
        console.error('❌ GET /api/assigned-tests/submit error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}