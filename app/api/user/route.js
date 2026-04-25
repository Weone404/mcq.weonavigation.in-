import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongoose';
import { UserModel } from '../../../lib/models';

export const dynamic = 'force-dynamic';

// POST /api/user — register (upsert) a user
export async function POST(request) {
  try {
    await connectDB();
    const { name, email, phone } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'name, email, and phone are required.' }, { status: 400 });
    }

    // Upsert: update name/phone if email already exists, else create
    const user = await UserModel.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { name, phone, email: email.toLowerCase().trim() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      joinedAt: user.joinedAt,
    });
  } catch (err) {
    console.error('POST /api/user error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET /api/user?email=... — fetch user by email
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) return NextResponse.json(null);

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      joinedAt: user.joinedAt,
    });
  } catch (err) {
    console.error('GET /api/user error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
