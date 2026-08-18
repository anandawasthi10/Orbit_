import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

// GET /api/teams/requests -> Admin fetches pending team join requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'Member';
    const isAdmin =
      userRole.toLowerCase().includes('admin') ||
      userRole.toLowerCase().includes('lead') ||
      userRole.toLowerCase().includes('manager') ||
      userRole.toLowerCase().includes('ceo') ||
      userRole.toLowerCase().includes('founder');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectDB();
    const allTeams = await Team.findAll();

    const pendingRequests: Array<{
      teamId: string;
      teamName: string;
      user: any;
      requestedAt: string;
      status: string;
    }> = [];

    allTeams.forEach((team: any) => {
      (team.pendingMembers || []).forEach((p: any) => {
        if (p.status === 'pending') {
          pendingRequests.push({
            teamId: team._id || team.id,
            teamName: team.name,
            user: p.user,
            requestedAt: p.requestedAt,
            status: p.status,
          });
        }
      });
    });

    return NextResponse.json(pendingRequests);
  } catch (error: any) {
    console.error('GET /api/teams/requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/requests -> Admin approves or rejects student request
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'Member';
    const isAdmin =
      userRole.toLowerCase().includes('admin') ||
      userRole.toLowerCase().includes('lead') ||
      userRole.toLowerCase().includes('manager') ||
      userRole.toLowerCase().includes('ceo') ||
      userRole.toLowerCase().includes('founder');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { teamId, userId, action } = await req.json();

    if (!teamId || !userId || !action) {
      return NextResponse.json(
        { error: 'teamId, userId, and action (approve|reject) are required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (action === 'approve') {
      const updatedTeam = await Team.approveMemberRequest(teamId, userId);

      // Create notification for student
      await Notification.create({
        adminId: userId,
        submitterName: 'Admin',
        taskTitle: updatedTeam.name || 'Team Workspace',
        message: `Your request to join team "${updatedTeam.name}" has been APPROVED by Admin!`,
        taskId: teamId,
      });

      return NextResponse.json(updatedTeam);
    } else if (action === 'reject') {
      const updatedTeam = await Team.rejectMemberRequest(teamId, userId);
      return NextResponse.json(updatedTeam);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('PATCH /api/teams/requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
