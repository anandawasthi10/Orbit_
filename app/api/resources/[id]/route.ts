import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    await Resource.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/resources/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
