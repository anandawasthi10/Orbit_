import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB, { isFallbackMode } from '@/lib/db';
import Member from '@/models/Member';
import Task from '@/models/Task';
import { readMembers, readTasks } from '@/lib/fileDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({ members: [], tasks: [] });
    }

    await connectDB();

    if (isFallbackMode()) {
      const lowerQ = query.toLowerCase();

      const allMembers = readMembers();
      const matchedMembers = allMembers
        .filter(
          (m) =>
            m.name?.toLowerCase().includes(lowerQ) ||
            m.role?.toLowerCase().includes(lowerQ) ||
            m.email?.toLowerCase().includes(lowerQ)
        )
        .slice(0, 5)
        .map((m) => ({
          _id: m._id || m.id,
          id: m._id || m.id,
          name: m.name,
          role: m.role || 'Member',
          avatarUrl: m.avatarUrl || '',
          email: m.email || '',
        }));

      const allTasks = readTasks();
      const matchedTasks = allTasks
        .filter(
          (t) =>
            t.title?.toLowerCase().includes(lowerQ) ||
            t.category?.toLowerCase().includes(lowerQ)
        )
        .slice(0, 5)
        .map((t) => {
          let assignedMemberObj = null;
          if (t.assignedTo) {
            const assignedId = String(t.assignedTo._id || t.assignedTo.id || t.assignedTo);
            const found = allMembers.find((m) => (m._id || m.id) === assignedId);
            if (found) {
              assignedMemberObj = {
                _id: found._id || found.id,
                name: found.name,
                avatarUrl: found.avatarUrl || '',
              };
            }
          }

          return {
            _id: t._id || t.id,
            id: t._id || t.id,
            title: t.title,
            category: t.category || 'General',
            status: t.status || 'todo',
            assignedTo: assignedMemberObj,
          };
        });

      return NextResponse.json({ members: matchedMembers, tasks: matchedTasks });
    }

    // MongoDB Mode
    const memberRegex = new RegExp(query, 'i');
    const matchedMembers = await Member.find({
      $or: [{ name: memberRegex }, { role: memberRegex }, { email: memberRegex }],
    })
      .select('name role avatarUrl email')
      .limit(5);

    const taskRegex = new RegExp(query, 'i');
    const matchedTasks = await Task.find({
      $or: [{ title: taskRegex }, { category: taskRegex }],
    })
      .populate('assignedTo', 'name avatarUrl role')
      .limit(5);

    return NextResponse.json({ members: matchedMembers, tasks: matchedTasks });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
