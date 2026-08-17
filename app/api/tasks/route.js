import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Task from '@/models/Task';

import Member from '@/models/Member';

export const dynamic = 'force-dynamic';

async function isUserAdminOrLead(sessionUser) {
  if (!sessionUser) return false;
  const adminRoles = ['admin', 'team lead', 'lead', 'project manager', 'founder', 'ceo'];
  const userRole = (sessionUser.role || '').toLowerCase().trim();
  if (adminRoles.some((r) => userRole.includes(r))) {
    return true;
  }

  const allMembers = await Member.find({});
  if (allMembers.length > 0) {
    const firstMember = allMembers[0];
    const firstId = String(firstMember._id || firstMember.id);
    const currId = String(sessionUser.id || sessionUser._id);
    const firstEmail = firstMember.email?.toLowerCase().trim();
    const currEmail = sessionUser.email?.toLowerCase().trim();

    if (firstId === currId || (firstEmail && currEmail && firstEmail === currEmail)) {
      return true;
    }
  }

  return false;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tasks = await Task.find({});
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, category, assignedTo, projectId, deadline, status } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const isAdmin = await isUserAdminOrLead(session.user);
    if (assignedTo && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the Admin or Team Lead can assign tasks to members.' },
        { status: 403 }
      );
    }

    const newTask = await Task.create({
      title: title.trim(),
      category: category || 'General',
      assignedTo: assignedTo || null,
      projectId: projectId || 'proj-sih-2026',
      status: status || 'todo',
      deadline: deadline ? new Date(deadline) : null,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
