import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Update from '@/models/Update';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const updates = await Update.find({});
    return NextResponse.json(updates);
  } catch (error) {
    console.error('GET /api/updates error:', error);
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

    const { message, type } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Update message is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const newUpdate = await Update.create({
      author: session.user.id,
      message: message.trim(),
      type: type || 'general',
    });

    return NextResponse.json(newUpdate, { status: 201 });
  } catch (error) {
    console.error('POST /api/updates error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
