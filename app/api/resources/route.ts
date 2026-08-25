import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const resources = await Resource.find({});
    return NextResponse.json(resources);
  } catch (error: any) {
    console.error('GET /api/resources error:', error);
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

    const { title, url, category } = await req.json();

    if (!title || !title.trim() || !url || !url.trim()) {
      return NextResponse.json(
        { error: 'Resource title and URL are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const newResource = await Resource.create({
      title: title.trim(),
      url: url.trim(),
      category: category || 'Other',
      addedBy: session?.user ? (session.user as any).id : null,
    });

    return NextResponse.json(newResource, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/resources error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
