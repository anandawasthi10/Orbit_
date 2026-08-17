import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Team from '@/models/Team';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ team: null }, { status: 200 });
    }

    const userId = session.user.id;
    const team = await Team.findUserTeam(userId);

    return NextResponse.json({ team: team || null }, { status: 200 });
  } catch (error) {
    console.error('Error fetching current user team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
