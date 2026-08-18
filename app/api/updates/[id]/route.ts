import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Update from '@/models/Update';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    await Update.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Update deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/updates/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
