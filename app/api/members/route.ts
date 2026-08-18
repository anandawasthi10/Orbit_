import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const members = await Member.find({});
    const safeMembers = (Array.isArray(members) ? members : []).map((m: any) =>
      m.toJSON ? m.toJSON() : m
    );
    return NextResponse.json(safeMembers);
  } catch (error: any) {
    console.error('GET /api/members error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
