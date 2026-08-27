import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Announcement from '@/models/Announcement';

export const dynamic = 'force-dynamic';

// GET all announcements (latest 200)
export async function GET() {
  try {
    await connectDB();
    const announcements = await Announcement.find();
    return NextResponse.json(Array.isArray(announcements) ? announcements : []);
  } catch (error: any) {
    console.error('GET /api/announcements error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST a new announcement
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { message, authorRole } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Announcement message is required' }, { status: 400 });
    }

    const userRole = (user?.role || 'member').toLowerCase();
    const isAdmin =
      user?.email === 'anandawasthi610@gmail.com' ||
      userRole.includes('admin') ||
      userRole.includes('lead') ||
      userRole.includes('manager') ||
      userRole.includes('ceo') ||
      userRole.includes('founder');

    await connectDB();
    const now = new Date().toISOString();
    const newAnnouncement = await Announcement.create({
      authorId: user.id || '',
      authorName: user.name || 'Team Member',
      authorAvatar: user.avatarUrl || '',
      authorRole: authorRole || (isAdmin ? 'admin' : 'member'),
      message: message.trim(),
      isoCreatedAt: now,
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/announcements error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
