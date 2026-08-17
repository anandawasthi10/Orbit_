import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Team from '@/models/Team';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { code } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Team code is required' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if team exists with code (case-insensitive)
    const targetTeam = await Team.findOne({ code: cleanCode });
    if (!targetTeam) {
      return NextResponse.json(
        { error: `Invalid team code "${cleanCode}". Please check the code and try again.` },
        { status: 404 }
      );
    }

    // Check if user is already in a team
    const currentTeam = await Team.findUserTeam(userId);
    if (currentTeam) {
      const isSameTeam =
        String(currentTeam._id || currentTeam.id) === String(targetTeam._id || targetTeam.id);
      if (isSameTeam) {
        return NextResponse.json(
          { error: 'You are already a member of this team' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'You are already in a team. Please leave your current team first.' },
        { status: 400 }
      );
    }

    // Add user to team members
    const updatedMembers = [
      ...(targetTeam.members || []),
      {
        user: userId,
        role: 'Member',
        joinedAt: new Date(),
      },
    ];

    const teamId = targetTeam._id || targetTeam.id;
    await Team.findByIdAndUpdate(teamId, { members: updatedMembers });

    const populatedTeam = await Team.findUserTeam(userId);

    return NextResponse.json(populatedTeam, { status: 200 });
  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join team' },
      { status: 500 }
    );
  }
}
