import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';

export const dynamic = 'force-dynamic';

async function getParamId(props: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  const resolved = await Promise.resolve(props.params);
  return resolved?.id || '';
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await getParamId(props);
    await connectDB();
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error: any) {
    console.error('GET /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await getParamId(props);
    const updates = await req.json();
    await connectDB();

    const updatedTask = await Task.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('PATCH /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await getParamId(props);
    await connectDB();
    await Task.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
