import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Team from '@/models/Team';
import Member from '@/models/Member';
import Update from '@/models/Update';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    let userId = (session?.user as any)?.id;
    if (session?.user && !userId && session.user.email) {
      const member = await Member.findOne({ email: session.user.email });
      if (member) userId = member._id || member.id;
    }

    const [tasks, userTeam, updates] = await Promise.all([
      Task.find({}),
      userId ? Team.findUserTeam(userId) : Promise.resolve(null),
      Update.find({}),
    ]);

    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length;
    const submittedTasksCount = tasks.filter((t: any) => t.status === 'submitted').length;
    const activeTasksCount = tasks.filter((t: any) => t.status === 'in_progress').length;
    const todoTasksCount = tasks.filter((t: any) => t.status === 'todo' || t.status === 'pending').length;

    const overallProgress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    let hasTeam = false;
    let teamMembersCount = 0;
    let membersWithStats: any[] = [];

    if (userTeam && userTeam.members && userTeam.members.length > 0) {
      hasTeam = true;
      teamMembersCount = userTeam.members.length;

      membersWithStats = userTeam.members.map((m: any) => {
        const userObj = typeof m.user === 'object' ? m.user : {};
        const memberId = String(userObj._id || userObj.id || m.user);
        const name = userObj.name || 'Teammate';
        const email = userObj.email || '';
        const avatarUrl = userObj.avatarUrl || '';
        const role = m.role || userObj.role || 'Member';

        const assignedTasks = tasks.filter((t: any) => {
          if (!t.assignedTo) return false;
          const taskAssignedId = String(t.assignedTo._id || t.assignedTo.id || t.assignedTo);
          return (
            taskAssignedId === memberId ||
            (t.assignedTo.email && email && t.assignedTo.email.toLowerCase() === email.toLowerCase())
          );
        });

        const memberTotal = assignedTasks.length;
        const memberCompleted = assignedTasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length;
        const completionPercentage =
          memberTotal > 0 ? Math.round((memberCompleted / memberTotal) * 100) : 0;

        return {
          _id: memberId,
          id: memberId,
          name,
          email,
          role,
          avatarUrl,
          completionPercentage,
          memberTotal,
          memberCompleted,
        };
      });
    }

    // Format updates for dashboard
    const formattedUpdates = updates.map((u: any) => {
      const authorObj = u.author || {};
      const createdAtDate = u.createdAt ? new Date(u.createdAt) : new Date();
      const diffHours = Math.round((Date.now() - createdAtDate.getTime()) / (1000 * 3600));
      const timeStr =
        diffHours < 1
          ? 'Just now'
          : diffHours < 24
          ? `${diffHours}h ago`
          : createdAtDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      return {
        id: u._id || u.id,
        user: authorObj.name || 'Teammate',
        avatarUrl: authorObj.avatarUrl || '',
        message: u.message,
        type: u.type || 'general',
        time: timeStr,
      };
    });

    return NextResponse.json({
      overallProgress,
      activeTasksCount,
      completedTasksCount,
      submittedTasksCount,
      todoTasksCount,
      totalTasks,
      hasTeam,
      teamMembersCount,
      membersWithStats,
      recentTasks: tasks,
      recentUpdates: formattedUpdates,
    });
  } catch (error: any) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
