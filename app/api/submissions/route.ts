import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Task from '@/models/Task';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const submittedBy = searchParams.get('submittedBy');

    await connectDB();

    const query: any = {};
    if (taskId) query.taskId = taskId;
    if (submittedBy) query.submittedBy = submittedBy;

    const submissions = await Submission.find(query);
    return NextResponse.json(submissions);
  } catch (error: any) {
    console.error('GET /api/submissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, link, screenshotUrl, note } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (!link || !link.trim()) {
      return NextResponse.json(
        { error: 'A submission link URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/.*)?$/i;
    if (!urlPattern.test(link.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid URL link (e.g. https://github.com/... or https://mydemo.com)' },
        { status: 400 }
      );
    }

    await connectDB();

    const submitterId = (session.user as any).id;
    const submitterName = session.user.name || 'Team Member';

    // 1. Create Submission record
    const newSubmission = await Submission.create({
      taskId,
      submittedBy: submitterId,
      link: link.trim(),
      screenshotUrl: screenshotUrl || '',
      note: note ? note.trim() : '',
      status: 'submitted',
      submittedAt: new Date(),
    });

    // 2. Update Task status and submission fields
    const targetTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedBy: submitterId,
        submittedByName: submitterName,
        submissionNote: note ? note.trim() : '',
        submissionFile: screenshotUrl || '',
        submissionFiles: screenshotUrl ? [screenshotUrl] : [],
        submissionLink: link.trim(),
      },
      { new: true }
    );

    const taskTitle = targetTask?.title || 'Assigned Task';

    // 3. Create Admin Notification
    await Notification.create({
      adminId: 'all',
      submitterName,
      taskTitle,
      message: `${submitterName} submitted task: "${taskTitle}"`,
      taskId,
      submissionId: newSubmission._id || newSubmission.id,
      isRead: false,
    });

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/submissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
