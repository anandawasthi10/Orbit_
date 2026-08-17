import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import ProgressSnapshot from '@/models/ProgressSnapshot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const snapshots = await ProgressSnapshot.find({});
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('GET /api/progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tasks = await Task.find({});
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const actualPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Linear projection calculation from 10 Aug 2026 to 25 Aug 2026 (15 days)
    const startDate = new Date('2026-08-10T00:00:00.000Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    const plannedPercent = Math.min(100, Math.max(0, Math.round((diffDays / 15) * 100)));

    const dateStr = today.toISOString().split('T')[0];

    const todaySnapshot = await ProgressSnapshot.upsertToday({
      dateStr,
      date: today,
      plannedPercent,
      actualPercent,
    });

    const allSnapshots = await ProgressSnapshot.find({});

    return NextResponse.json({
      todaySnapshot,
      snapshots: allSnapshots,
    });
  } catch (error) {
    console.error('POST /api/progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
