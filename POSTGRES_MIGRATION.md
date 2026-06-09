# PostgreSQL Migration Guide

This guide provides the SQL schema needed to set up your PostgreSQL database for the DGCA Prep application.

## 1. Create the `users` table (formerly `students`)

```sql
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

-- Create index for email lookups (frequently used in queries)
CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_phone ON users(phone);
```

## 2. Create the `test_results` table

```sql
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

-- Create indexes for common queries
CREATE INDEX idx_test_results_email ON test_results(LOWER(student_email));
CREATE INDEX idx_test_results_date ON test_results(date);
```

## 3. Create the `rtr_attempts` table

```sql
CREATE TABLE IF NOT EXISTS rtr_attempts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mode VARCHAR(50) DEFAULT 'practice',
    scenario_id VARCHAR(255),
    callsign VARCHAR(50),
    departure VARCHAR(50),
    destination VARCHAR(50),
    phases JSONB DEFAULT '[]'::jsonb,
    total_score INT DEFAULT 0,
    max_total_score INT DEFAULT 100,
    percentage INT DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    examiner_remarks TEXT,
    duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_rtr_attempts_user ON rtr_attempts(user_id);
CREATE INDEX idx_rtr_attempts_date ON rtr_attempts(created_at);
```

## 4. Create the `attendance` table

```sql
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50),
    batch VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_attendance_email ON attendance(LOWER(email));
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_batch ON attendance(batch);
```

## 5. Create the `classes` table (if using Live Classes feature)

```sql
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    meeting_link VARCHAR(500),
    batch VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_classes_subject ON classes(subject);
CREATE INDEX idx_classes_start_time ON classes(start_time);
```

## 6. Create the `doubt_sessions` table (if using Doubt Chat feature)

```sql
CREATE TABLE IF NOT EXISTS doubt_sessions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    subject VARCHAR(255),
    doubt TEXT,
    reply TEXT,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_doubt_sessions_student ON doubt_sessions(student_email);
CREATE INDEX idx_doubt_sessions_status ON doubt_sessions(status);
```

## 7. Migration Steps

### Option A: Using psql (Recommended)

1. **Connect to your PostgreSQL database:**
   ```bash
   psql -h your_host -U your_user -d your_database
   ```

2. **Run all the SQL statements above** (copy-paste each CREATE TABLE block)

3. **Verify tables were created:**
   ```sql
   \dt
   ```

### Option B: Using environment file

1. **Create a `schema.sql` file** with all the SQL above
2. **Run it:**
   ```bash
   psql -h your_host -U your_user -d your_database -f schema.sql
   ```

### Option C: Using a migration tool (Liquibase, Flyway, etc.)

Create versioned migration files and use your preferred tool.

## 8. Required Environment Variables

Add to your `.env.local`:

```bash
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

## 9. Verification

Test the connection from your app:

```bash
node -e "const pool = require('pg').Pool; const p = new pool({ connectionString: process.env.DATABASE_URL }); p.query('SELECT NOW()', (err, res) => { console.log(err || res.rows); process.exit(); });"
```

## 10. Data Migration from MongoDB (if applicable)

If you're migrating existing data from MongoDB:

1. **Export MongoDB collections as JSON:**
   ```bash
   mongoexport --collection=students --out=students.json
   mongoexport --collection=test_results --out=results.json
   ```

2. **Transform and import to PostgreSQL** using a script or tool like `pgloader`

## 11. Notes

- All table names use snake_case (PostgreSQL convention)
- `JSONB` is used for complex nested data (phases, answers)
- Indexes are created on frequently searched columns for performance
- All timestamps use UTC (CURRENT_TIMESTAMP in PostgreSQL)
- Foreign key constraints can be added later if needed

## 12. After Migration

1. Restart your Next.js app
2. Test login and core features
3. Verify data appears correctly in the dashboard
4. Check teacher/admin panels for attendance and student data

---

**Support**: If you encounter issues, check:
- `.env.local` has correct `DATABASE_URL`
- All tables exist: `\dt` in psql
- Your PostgreSQL version supports JSONB (9.4+)
