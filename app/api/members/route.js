import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view the team directory.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find members, sort by newest first
    const members = await Member.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(members);
  } catch (error) {
    console.error('GET /api/members error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
