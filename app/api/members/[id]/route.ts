import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export const dynamic = 'force-dynamic';

// Helper to safely extract id from params (supports Next.js 14 and Next.js 15/16 async params)
async function getParamId(props: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  const resolved = await Promise.resolve(props.params);
  return resolved?.id || '';
}

// PATCH /api/members/[id] — Admin only: update a member's role or profile details
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = ((session.user as any).role || '').toLowerCase();
    const isAdmin =
      userRole.includes('admin') ||
      userRole.includes('lead') ||
      userRole.includes('manager') ||
      userRole.includes('ceo') ||
      userRole.includes('founder');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const id = await getParamId(props);
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const body = await req.json();
    await connectDB();

    const updated = await Member.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/members/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] — Admin only: permanently delete a member
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = ((session.user as any).role || '').toLowerCase();
    const userEmail = ((session.user as any).email || '').toLowerCase();
    const isAdmin =
      userEmail === 'anandawasthi610@gmail.com' ||
      userRole.includes('admin') ||
      userRole.includes('lead') ||
      userRole.includes('manager') ||
      userRole.includes('ceo') ||
      userRole.includes('founder');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const id = await getParamId(props);
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deleting the primary admin
    if (id === '671a53ff-505e-4e47-b75c-13963477cfdb' || id === 'admin-orbit-001') {
      return NextResponse.json(
        { error: 'Cannot delete the system admin account' },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted = await Member.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/members/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
