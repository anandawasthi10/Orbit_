import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import ProgressSnapshot from '@/models/ProgressSnapshot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const snapshots = await ProgressSnapshot.find({});
    return NextResponse.json({ snapshots });
  } catch (error: any) {
    console.error('GET /api/progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectDB();

    const tasks = await Task.find({});
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const actualPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    const plannedPercent = Math.min(100, Math.round(((dayOfWeek + 1) / 7) * 100));

    const todaySnapshot = await ProgressSnapshot.upsertToday({
      dateStr,
      date: today,
      plannedPercent,
      actualPercent,
    });

    const snapshots = await ProgressSnapshot.find({});

    return NextResponse.json({
      todaySnapshot,
      snapshots,
    });
  } catch (error: any) {
    console.error('POST /api/progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
