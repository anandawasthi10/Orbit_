import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
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
    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('GET /api/submissions/[id] error:', error);
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
    const { status } = await req.json(); // 'approved' | 'rejected'
    await connectDB();

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Also sync Task status if approved or rejected
    if (updatedSubmission.taskId) {
      const taskId = typeof updatedSubmission.taskId === 'object'
        ? (updatedSubmission.taskId._id || updatedSubmission.taskId.id)
        : updatedSubmission.taskId;
      
      const newTaskStatus = status === 'approved' ? 'completed' : status === 'rejected' ? 'rejected' : 'submitted';
      await Task.findByIdAndUpdate(taskId, { status: newTaskStatus });
    }

    return NextResponse.json(updatedSubmission);
  } catch (error: any) {
    console.error('PATCH /api/submissions/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
