import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Team from '@/models/Team';

export const dynamic = 'force-dynamic';

async function getParamId(props: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  const resolved = await Promise.resolve(props.params);
  return resolved?.id || '';
}

// DELETE /api/teams/[id] — Admin only: delete team
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
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    await connectDB();

    if (Team.findByIdAndDelete) {
      await Team.findByIdAndDelete(id);
    } else {
      const { FileTeamStore } = await import('@/lib/fileDb');
      await FileTeamStore.findByIdAndDelete(id);
    }

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/teams/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
