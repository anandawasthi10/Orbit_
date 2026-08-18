import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Team from '@/models/Team';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Team invitation code is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Check if user is already in a team
    const existingTeam = await Team.findUserTeam(userId);
    if (existingTeam) {
      return NextResponse.json(
        { error: 'You are already a member of a team. Leave your current team first.' },
        { status: 400 }
      );
    }

    const updatedTeam = await Team.addMemberByCode(code.trim().toUpperCase(), userId);
    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    console.error('POST /api/teams/join error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
