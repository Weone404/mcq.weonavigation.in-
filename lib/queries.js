// lib/queries.js
import pool from './db';

// ═══════════════════════════════════════════════════════
// USERS  (fixed: was pointing to 'students' table)
// ═══════════════════════════════════════════════════════

export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );
  return rows[0] || null;
}

export async function findUserByEmailAndPhone(email, phone) {
  const { rows } = await pool.query(
    `SELECT * FROM users 
     WHERE LOWER(email) = LOWER($1) AND phone = $2`,
    [email.trim(), phone.trim()]
  );
  return rows[0] || null;
}

export async function findUserByPhone(phone) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE phone = $1`,
    [phone.trim()]
  );
  return rows[0] || null;
}

async function hasUsersBatchColumn() {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    ['users', 'batch']
  );
  return rows.length > 0;
}

async function ensureUsersIdDefault() {
  const { rows } = await pool.query(
    `SELECT column_default FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    ['users', 'id']
  );
  const columnDefault = rows[0]?.column_default;
  if (columnDefault) return;

  await pool.query(`CREATE SEQUENCE IF NOT EXISTS users_id_seq`);
  await pool.query(`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0))`);
  await pool.query(`ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq')`);
}

export async function createUser({ name, email, phone, batch }) {
  const batchColumnExists = await hasUsersBatchColumn();
  await ensureUsersIdDefault();

  const queryText = batchColumnExists
    ? `INSERT INTO users (name, email, phone, batch)
       VALUES ($1, $2, $3, $4)
       RETURNING *`
    : `INSERT INTO users (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING *`;

  const params = batchColumnExists
    ? [name, email.toLowerCase().trim(), phone.trim(), batch || 'Batch A — Morning']
    : [name, email.toLowerCase().trim(), phone.trim()];

  try {
    const { rows } = await pool.query(queryText, params);
    return rows[0];
  } catch (err) {
    if (err.code === '23502' && err.detail?.includes('column "id"')) {
      await ensureUsersIdDefault();
      const { rows } = await pool.query(queryText, params);
      return rows[0];
    }
    throw err;
  }
}

export async function getAllUsers() {
  const { rows } = await pool.query(
    `SELECT * FROM users ORDER BY created_at DESC`
  );
  return rows;
}

export async function deleteUserByEmail(email) {
  await pool.query(
    `DELETE FROM users WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );
}

// ═══════════════════════════════════════════════════════
// RESULTS  (unchanged)
// ═══════════════════════════════════════════════════════

export async function getResultsByEmail(email, limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM test_results 
     WHERE LOWER(student_email) = LOWER($1)
     ORDER BY date DESC
     LIMIT $2`,
    [email.trim(), limit]
  );
  return rows.map(r => ({
    id: r.id.toString(),
    userEmail: r.student_email,
    chapterId: r.chapter_id,
    score: r.score,
    total: r.total,
    answers: r.answers || [],
    date: r.date,
    pct: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
  }));
}

export async function createResult({ userEmail, chapterId, score, total, answers }) {
  const { rows } = await pool.query(
    `INSERT INTO test_results (student_email, chapter_id, score, total, answers, date)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, date`,
    [
      userEmail.toLowerCase().trim(),
      chapterId,
      Number(score),
      Number(total),
      JSON.stringify(answers || []),
    ]
  );
  return rows[0];
}

export async function countResultsByEmail(email) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM test_results 
     WHERE LOWER(student_email) = LOWER($1)`,
    [email.trim()]
  );
  return parseInt(rows[0].count);
}

export async function deleteOldestResults(email, keepCount) {
  await pool.query(
    `DELETE FROM test_results
     WHERE id IN (
       SELECT id FROM test_results
       WHERE LOWER(student_email) = LOWER($1)
       ORDER BY date ASC
       LIMIT $2
     )`,
    [email.trim(), keepCount]
  );
}

export async function getAllResults() {
  const { rows } = await pool.query(
    `SELECT * FROM test_results ORDER BY date DESC`
  );
  return rows.map(r => ({
    id: r.id.toString(),
    userEmail: r.student_email,
    chapterId: r.chapter_id,
    score: r.score,
    total: r.total,
    answers: r.answers || [],
    date: r.date,
    pct: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
  }));
}

// ═══════════════════════════════════════════════════════
// LEADERBOARD  (unchanged)
// ═══════════════════════════════════════════════════════

export async function getLeaderboardEntry(email) {
  const { rows } = await pool.query(
    `SELECT * FROM leaderboard WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );
  return rows[0] || null;
}

export async function upsertLeaderboard({ email, name, score, total }) {
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const { rows } = await pool.query(
    `INSERT INTO leaderboard (email, name, total_score, total_questions, tests_attempted, accuracy)
     VALUES ($1, $2, $3, $4, 1, $5)
     ON CONFLICT (email) DO UPDATE SET
       name             = EXCLUDED.name,
       total_score      = leaderboard.total_score + EXCLUDED.total_score,
       total_questions  = leaderboard.total_questions + EXCLUDED.total_questions,
       tests_attempted  = leaderboard.tests_attempted + 1,
       accuracy         = ROUND(
                            (leaderboard.total_score + EXCLUDED.total_score)::numeric /
                            NULLIF(leaderboard.total_questions + EXCLUDED.total_questions, 0) * 100
                          )
     RETURNING *`,
    [email.toLowerCase().trim(), name, Number(score), Number(total), accuracy]
  );
  return rows[0];
}

export async function getAllLeaderboard() {
  const { rows } = await pool.query(
    `SELECT * FROM leaderboard ORDER BY accuracy DESC, total_score DESC`
  );
  return rows;
}