import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export const dynamic = 'force-dynamic';

async function getParamId(props: { params: Promise<{ id: string }> | { id: string } }): Promise<string> {
  const resolved = await Promise.resolve(props.params);
  return resolved?.id || '';
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const memberId = await getParamId(props);
    if (!memberId) {
      return new NextResponse('Member ID required', { status: 400 });
    }

    await connectDB();
    const member = await Member.findById(memberId);
    if (!member || !member.avatarUrl) {
      return new NextResponse('Avatar not found', { status: 404 });
    }

    const avatarUrl: string = member.avatarUrl;

    // 1. If stored as Base64 Data URL, stream the raw binary image
    if (avatarUrl.startsWith('data:image/')) {
      const commaIndex = avatarUrl.indexOf(',');
      if (commaIndex === -1) {
        return new NextResponse('Invalid image data', { status: 400 });
      }

      const header = avatarUrl.substring(0, commaIndex);
      const base64Data = avatarUrl.substring(commaIndex + 1);
      const mimeMatch = header.match(/data:(image\/[a-zA-Z0-9+.-]+);base64/i);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        },
      });
    }

    // 2. If it's an external URL or static upload path, redirect to it
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return NextResponse.redirect(avatarUrl);
    }

    if (avatarUrl.startsWith('/')) {
      const origin = req.nextUrl.origin;
      return NextResponse.redirect(new URL(avatarUrl, origin));
    }

    return new NextResponse('Avatar not found', { status: 404 });
  } catch (error: any) {
    console.error('GET /api/members/[id]/avatar error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
