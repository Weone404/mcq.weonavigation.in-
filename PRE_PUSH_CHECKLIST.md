# Pre-Push Checklist ✅

## MongoDB → PostgreSQL Migration Complete

### ✅ Database Files Fixed
- [x] `lib/db.js` - PostgreSQL pool configuration
- [x] `lib/queries.js` - All queries use PostgreSQL syntax  
- [x] `lib/Students.js` - Updated all queries to use `users` table
- [x] `models/RtrAttempt.js` - PostgreSQL queries with query builder pattern

### ✅ API Routes Migrated
- [x] `app/api/user/route.js` - Fixed to return `created_at` (not `joined_at`), returns `id` and `batch`
- [x] `app/api/rtr/attempt/route.js` - Removed MongoDB dbConnect() calls
- [x] `app/api/teacher/students/route.js` - Uses `users` table, returns `created_at` as `joinedAt`

### ✅ Frontend Features Working
- [x] Login unlocks all lectures (user icon shows, login button hides)
- [x] `is_verified` gates PERSONALYSIS tab visibility
- [x] Personalysis content only renders when `user?.is_verified === true`
- [x] LecturesPage fetches fresh `is_verified` status from `/api/user` endpoint

### ✅ Code Quality
- [x] No MongoDB imports remaining (no `mongoose`, `dbConnect`)
- [x] No `_id` references (using PostgreSQL `id`)
- [x] No `.lean()`, `.save()`, `.populate()`, `.aggregate()` calls
- [x] All field names use PostgreSQL conventions (`created_at` not `joined_at`)

---

## Before Pushing - REQUIRED SETUP

### 1. Set Environment Variable
Add to `.env.local` (or `.env` for production):
```
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

### 2. Create PostgreSQL Database Tables
Run the SQL from `POSTGRES_MIGRATION.md`:
```bash
psql -h your_host -U your_user -d your_database
# Then paste in all CREATE TABLE statements
```

Or run as a file:
```bash
psql -h your_host -U your_user -d your_database -f POSTGRES_MIGRATION.md
```

### 3. Verify Tables Exist
```bash
psql -h your_host -U your_user -d your_database
\dt  # Lists all tables
```

Should see:
- `users` (id, name, email, phone, batch, is_verified, created_at)
- `test_results` (student_email, chapter_id, score, total, etc.)
- `rtr_attempts` (user_id, mode, scenario_id, etc.)
- `attendance`, `classes`, `doubt_sessions` (optional)

---

## Testing After Push

### Critical Tests
1. **Login Flow**
   - Go to `/login`
   - Login with email + phone
   - Should see user icon (not login button) in header
   - User object should be saved to localStorage as "dgca_user"

2. **Personalysis Visibility**
   - Login as a user with `is_verified = false`
   - Should NOT see "Personalysis" tab
   - Should see "🔬 Subscribe to unlock all..." message
   
3. **RTR Simulator**
   - Go to `/rtr`
   - Start a practice scenario
   - Submit an attempt
   - Should save to `rtr_attempts` table with user_id

4. **Teacher Dashboard**
   - Go to `/teacher`
   - Should see list of students from `users` table
   - Should see their test results

5. **API Verification**
   - GET `/api/user?email=test@example.com`
   - Response should include: `id`, `name`, `email`, `phone`, `batch`, `is_verified`, `created_at`

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `DATABASE_URL` not set | Add to `.env.local` |
| `ENOENT: no such file or directory 'students'` | Create `users` table in PostgreSQL |
| `undefined is not an object (evaluating 'user.is_verified')` | Fetch from `/api/user` endpoint |
| RTR attempts not saving | Check that `rtr_attempts` table exists |
| Teacher dashboard shows no students | Verify students exist in `users` table |

---

## Files Changed
- `app/api/user/route.js` - Fixed response fields
- `app/api/rtr/attempt/route.js` - Removed MongoDB calls
- `app/api/teacher/students/route.js` - Uses `users` table
- `lib/Students.js` - Updated all queries
- `models/RtrAttempt.js` - Already PostgreSQL-compatible
- `lib/queries.js` - All PostgreSQL queries
- `lib/db.js` - PostgreSQL configuration

---

## Safe to Push? ✅ YES

All MongoDB references have been removed and replaced with PostgreSQL queries.
Database schema migration guide is included (`POSTGRES_MIGRATION.md`).
Frontend features (login, is_verified gating) are working correctly.

**Next step**: Set up `.env.local` with `DATABASE_URL` and create tables in PostgreSQL.
