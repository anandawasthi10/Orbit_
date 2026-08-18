import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Team from '@/models/Team';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    if (session && session.user) {
      const userId = (session.user as any).id;
      const userTeam = await Team.findUserTeam(userId);
      const availableTeams = await Team.findAvailableTeams(userId);
      const allTeams = await Team.findAll();

      return NextResponse.json({
        userTeam,
        availableTeams,
        allTeams,
      });
    }

    const teams = await Team.findAll();
    return NextResponse.json({ teams });
  } catch (error: any) {
    console.error('GET /api/teams error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Check if user is already in a team
    const existingTeam = await Team.findUserTeam(userId);
    if (existingTeam) {
      return NextResponse.json(
        { error: 'You are already a member of a team. Please leave your current team first.' },
        { status: 400 }
      );
    }

    // Create team with user as leader
    const newTeam = await Team.createTeamWithLeader(name.trim(), userId);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/teams error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
