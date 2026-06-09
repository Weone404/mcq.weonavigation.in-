import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { createUser, findUserByEmail } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

// POST /api/user — register (upsert) a user
export async function POST(request) {
  try {
    const { name, email, phone } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'name, email, and phone are required.' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();
    let user = await findUserByEmail(emailNormalized);

    if (user) {
      // ✅ Fixed: 'users' not 'students'
      const { rows } = await pool.query(
        `UPDATE users SET name = $1, phone = $2
         WHERE LOWER(email) = LOWER($3)
         RETURNING *`,
        [name, phone.trim(), emailNormalized]
      );
      user = rows[0];
    } else {
      user = await createUser({ name, email: emailNormalized, phone: phone.trim() });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      batch: user.batch,
      is_verified: user.is_verified ?? false,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('POST /api/user error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET /api/user?email=... — fetch user by email
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });

    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) return NextResponse.json(null);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      batch: user.batch,
      is_verified: user.is_verified ?? false,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('GET /api/user error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}