// lib/Students.js
import pool from './db';

// Get all students (used by teacher dashboard, attendance, etc.)
export async function getAllStudents() {
  const { rows } = await pool.query(
    'SELECT * FROM users ORDER BY created_at DESC'
  );
  return rows;
}

// Check if a student is allowed to log in (replaces the old array lookup)
export async function findStudentByEmailAndPhone(email, phone) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND phone = $2',
    [email, phone]
  );
  return rows[0] || null;  // returns student object or null
}

// Find by email only (for JWT auth — after login)
export async function findStudentByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return rows[0] || null;
}