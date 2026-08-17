import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Team, { generateTeamCode } from '@/models/Team';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Check if user is already in a team
    const existingTeam = await Team.findUserTeam(userId);
    if (existingTeam) {
      return NextResponse.json(
        { error: 'You are already a member of a team. Please leave your current team before creating a new one.' },
        { status: 400 }
      );
    }

    // Generate unique 6-character code
    let code = generateTeamCode();
    let collisionCheck = await Team.findOne({ code });
    let attempts = 0;
    while (collisionCheck && attempts < 10) {
      code = generateTeamCode();
      collisionCheck = await Team.findOne({ code });
      attempts++;
    }

    const newTeam = await Team.create({
      name: name.trim(),
      code,
      createdBy: userId,
      members: [
        {
          user: userId,
          role: 'Team Leader',
          joinedAt: new Date(),
        },
      ],
    });

    const populatedTeam = await Team.findUserTeam(userId);

    return NextResponse.json(populatedTeam || newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create team' },
      { status: 500 }
    );
  }
}
