import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    await connectDB();
    const adminId = (session.user as any).id;

    const list = await Notification.find({ adminId });
    const notifications = Array.isArray(list) ? list : [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json().catch(() => ({}));
    await connectDB();

    const result = await Notification.markAsRead(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
