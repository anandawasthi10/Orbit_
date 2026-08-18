import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await req.json();
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    await connectDB();
    const userId = (session.user as any).id;
    const userName = session.user.name || 'Student';

    // Submit join request
    const updatedTeam = await Team.requestJoin(teamId, userId);

    // Create Notification alert for Admin
    await Notification.create({
      adminId: 'all',
      submitterName: userName,
      taskTitle: updatedTeam.name || 'Team Workspace',
      message: `${userName} requested to join team "${updatedTeam.name}"`,
      taskId: teamId,
      submissionId: userId,
    });

    return NextResponse.json(updatedTeam, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/teams/request-join error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit join request' },
      { status: 400 }
    );
  }
}
