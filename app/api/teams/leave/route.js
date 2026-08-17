import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Team from '@/models/Team';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const currentTeam = await Team.findUserTeam(userId);

    if (!currentTeam) {
      return NextResponse.json(
        { error: 'You are not currently a member of any team' },
        { status: 400 }
      );
    }

    const teamId = currentTeam._id || currentTeam.id;
    const existingMembers = currentTeam.members || [];

    // Filter out the leaving user
    const remainingMembers = existingMembers.filter((m) => {
      const mUserId = typeof m.user === 'object' ? String(m.user._id || m.user.id) : String(m.user);
      return mUserId !== String(userId);
    });

    if (remainingMembers.length === 0) {
      // Last member leaving - delete the team
      await Team.findByIdAndDelete(teamId);
    } else {
      // Check if leaving user was a Team Leader
      const leavingMember = existingMembers.find((m) => {
        const mUserId = typeof m.user === 'object' ? String(m.user._id || m.user.id) : String(m.user);
        return mUserId === String(userId);
      });

      const wasLeader = leavingMember?.role === 'Team Leader';
      const hasOtherLeader = remainingMembers.some((m) => m.role === 'Team Leader');

      if (wasLeader && !hasOtherLeader) {
        // Auto-promote earliest joined remaining member to Team Leader
        remainingMembers.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
        remainingMembers[0].role = 'Team Leader';
      }

      await Team.findByIdAndUpdate(teamId, { members: remainingMembers });
    }

    return NextResponse.json({ message: 'Successfully left team' }, { status: 200 });
  } catch (error) {
    console.error('Error leaving team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to leave team' },
      { status: 500 }
    );
  }
}
