import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Team from '@/models/Team';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as any).id;
    const currentTeam = await Team.findUserTeam(userId);

    if (!currentTeam) {
      return NextResponse.json(
        { error: 'You are not currently a member of any team' },
        { status: 400 }
      );
    }

    const teamId = currentTeam._id || currentTeam.id;
    const result = await Team.removeMember(teamId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/teams/leave error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
