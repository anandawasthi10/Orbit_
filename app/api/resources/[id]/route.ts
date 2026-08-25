import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';

export const dynamic = 'force-dynamic';

async function getParamId(props: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  const resolved = await Promise.resolve(props.params);
  return resolved?.id || '';
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await getParamId(props);
    await connectDB();
    await Resource.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/resources/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
