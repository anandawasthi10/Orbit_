import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Update from '@/models/Update';

export const dynamic = 'force-dynamic';

async function getParamId(props: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  const resolved = await Promise.resolve(props.params);
  return resolved?.id || '';
}

// DELETE /api/updates/[id] — Delete an update (Admin can delete any; authors can delete their own)
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = await getParamId(props);
    if (!id) {
      return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
    }

    await connectDB();

    const currentUserId = String((session.user as any).id || '');
    const userEmail = String((session.user as any).email || '').toLowerCase();
    const userRole = String((session.user as any).role || '').toLowerCase();

    const isAdmin =
      userEmail === 'anandawasthi610@gmail.com' ||
      userRole.includes('admin') ||
      userRole.includes('lead') ||
      userRole.includes('manager') ||
      userRole.includes('ceo') ||
      userRole.includes('founder');

    // If not admin, check if user is the author
    if (!isAdmin) {
      const updates = await Update.find({});
      const target = (Array.isArray(updates) ? updates : []).find(
        (u: any) => String(u._id || u.id) === String(id)
      );
      if (!target) {
        return NextResponse.json({ error: 'Update not found' }, { status: 404 });
      }

      const authorId = String(
        typeof target.author === 'object' ? target.author?._id || target.author?.id : target.author || ''
      );

      if (authorId !== currentUserId) {
        return NextResponse.json({ error: 'Forbidden: You can only delete your own updates' }, { status: 403 });
      }
    }

    await Update.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Update deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/updates/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
