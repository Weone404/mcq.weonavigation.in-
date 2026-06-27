const fs = require('fs');
const { Pool } = require('pg');

async function main() {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const m = env.match(/DATABASE_URL=(.*)/);
    if (!m) {
      console.error('DATABASE_URL not found in .env');
      process.exit(1);
    }
    const conn = m[1].trim();
    const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

    const sql = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    batch VARCHAR(255) DEFAULT 'Batch A — Morning',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    student_email VARCHAR(255) NOT NULL,
    chapter_id VARCHAR(255) NOT NULL,
    score INT DEFAULT 0,
    total INT DEFAULT 0,
    answers JSONB DEFAULT '[]'::jsonb,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_results_email ON test_results(LOWER(student_email));
CREATE INDEX IF NOT EXISTS idx_test_results_date ON test_results(date);

CREATE TABLE IF NOT EXISTS mock_leaderboard (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    guest_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL DEFAULT 'all',
    subject_label VARCHAR(255) NOT NULL DEFAULT 'All Subjects',
    score INT DEFAULT 0,
    total INT DEFAULT 0,
    accuracy INT DEFAULT 0,
    attempts INT DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_leaderboard_email ON mock_leaderboard(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_mock_leaderboard_guest_id ON mock_leaderboard(guest_id);
CREATE INDEX IF NOT EXISTS idx_mock_leaderboard_subject ON mock_leaderboard(subject);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    batch VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_email, date, batch)
);

CREATE INDEX IF NOT EXISTS idx_attendance_email ON attendance(LOWER(student_email));
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_batch ON attendance(batch);

CREATE TABLE IF NOT EXISTS live_classes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date_time TIMESTAMP NOT NULL,
    end_date_time TIMESTAMP NOT NULL,
    meet_link VARCHAR(500) NOT NULL,
    batch VARCHAR(255) DEFAULT 'All Batches',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_classes_start_date_time ON live_classes(start_date_time);
CREATE INDEX IF NOT EXISTS idx_live_classes_batch ON live_classes(batch);

CREATE TABLE IF NOT EXISTS live_links (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    label VARCHAR(255) DEFAULT 'Live Class',
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_links_set_at ON live_links(set_at);
`;

    await pool.query(sql);
    console.log('Migration completed');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Migration error', e);
    process.exit(1);
  }
}

main();
