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
-- Add subject_id column to test_results if it doesn't exist
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS subject_id VARCHAR(255);
`;

    await pool.query(sql);
    console.log('✓ Added subject_id column to test_results');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Alter table error', e);
    process.exit(1);
  }
}

main();
