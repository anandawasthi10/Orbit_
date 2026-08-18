import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Member from '@/models/Member';
import Task from '@/models/Task';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q) {
      return NextResponse.json({ members: [], tasks: [] });
    }

    await connectDB();

    const [members, tasks] = await Promise.all([
      Member.find({}),
      Task.find({}),
    ]);

    const lowerQ = q.toLowerCase();

    // Filter members matching query by name, role, email, or skills
    const matchingMembers = members.filter((m: any) => {
      const name = (m.name || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const skills = Array.isArray(m.skills) ? m.skills.join(' ').toLowerCase() : '';
      return (
        name.includes(lowerQ) ||
        role.includes(lowerQ) ||
        email.includes(lowerQ) ||
        skills.includes(lowerQ)
      );
    });

    // Filter tasks matching query by title or category
    const matchingTasks = tasks.filter((t: any) => {
      const title = (t.title || '').toLowerCase();
      const category = (t.category || '').toLowerCase();
      return title.includes(lowerQ) || category.includes(lowerQ);
    });

    return NextResponse.json({
      members: matchingMembers.slice(0, 5),
      tasks: matchingTasks.slice(0, 5),
    });
  } catch (error: any) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
