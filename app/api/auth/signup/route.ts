import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();

    // Check if member already exists
    const existingMember = await Member.findOne({ email: normalizedEmail });
    if (existingMember) {
      return NextResponse.json(
        { error: 'Email already registered. Please log in.' },
        { status: 400 }
      );
    }

    // Hash password with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new Member with designated role
    const member = await Member.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'Team Member',
      profileComplete: true,
    });

    const memberData = member.toJSON ? member.toJSON() : member;

    return NextResponse.json(memberData, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
