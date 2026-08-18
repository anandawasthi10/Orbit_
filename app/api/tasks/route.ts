import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Task from '@/models/Task';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find({});
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { title, description, category, assignedTo, assignedBy, projectId, priority, status, deadline } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const creatorId = session?.user ? (session.user as any).id : null;

    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'General',
      assignedTo: assignedTo || null,
      assignedBy: assignedBy || creatorId,
      projectId: projectId || 'proj-sih-2026',
      priority: priority || 'medium',
      status: status || 'todo',
      deadline: deadline || null,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
