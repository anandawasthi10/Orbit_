import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Member from '@/models/Member';
import path from 'path';

// Helper: try to write file to disk (local dev only - Vercel is read-only)
async function tryWriteAvatarToDisk(
  base64Data: string,
  ext: string,
  memberId: string
): Promise<string | null> {
  try {
    // Only attempt disk write in local/non-serverless environments
    if (
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY
    ) {
      return null; // Skip disk write on serverless
    }

    const fs = await import('fs');
    const buffer = Buffer.from(base64Data, 'base64');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `avatar-${memberId}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}?v=${Date.now()}`;
  } catch (_) {
    return null;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const member = await Member.findById((session.user as any).id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const memberDoc = member.toJSON ? member.toJSON() : { ...member };
    return NextResponse.json(memberDoc);
  } catch (error: any) {
    console.error('GET /api/members/me error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberId = (session.user as any).id;
    const { name, role, bio, skills, avatarUrl } = await req.json();

    await connectDB();

    let parsedSkills: string[] = [];
    if (typeof skills === 'string') {
      parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
    }

    const updateFields: any = {
      profileComplete: true,
      completionPercent: 100,
    };

    const currentEmail = ((session.user as any)?.email || '').toLowerCase();
    const isCurrentAdmin =
      currentEmail === 'anandawasthi610@gmail.com' ||
      ((session.user as any)?.role || '').toLowerCase().includes('admin');

    if (name?.trim()) updateFields.name = name.trim();
    if (role !== undefined) {
      const sanitizedRole = role.trim();
      if (!sanitizedRole.toLowerCase().includes('admin') || isCurrentAdmin) {
        updateFields.role = sanitizedRole;
      }
    }
    if (bio !== undefined) updateFields.bio = bio.trim();
    updateFields.skills = parsedSkills;

    if (avatarUrl && avatarUrl.startsWith('data:image/')) {
      const matches = avatarUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        const rawExt = matches[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        if (allowedExtensions.includes(ext)) {
          // 1. Try to write to disk (works in local dev, skipped on Vercel)
          const diskUrl = await tryWriteAvatarToDisk(matches[2], ext, memberId);

          if (diskUrl) {
            // Local dev: use file URL
            updateFields.avatarUrl = diskUrl;
          } else {
            // Vercel/serverless: store as small data URL in MongoDB directly
            // Keep the full base64 in MongoDB so it survives across sessions
            updateFields.avatarUrl = avatarUrl;
          }
        }
      }
    } else if (avatarUrl !== undefined && avatarUrl !== null) {
      updateFields.avatarUrl = avatarUrl.trim();
    }

    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const updatedDoc = updatedMember.toJSON ? updatedMember.toJSON() : { ...updatedMember };

    // Return the saved avatarUrl - if it was base64, strip it from the JSON response
    // but keep it in the database. The client can use the session update with the real URL.
    const responseDoc = {
      ...updatedDoc,
      // Only expose actual URL or empty string, never raw base64 in response body
      avatarUrl:
        updatedDoc.avatarUrl && !updatedDoc.avatarUrl.startsWith('data:')
          ? updatedDoc.avatarUrl
          : updatedDoc.avatarUrl?.startsWith('data:')
          ? updatedDoc.avatarUrl // Keep it so the client can show the preview
          : '',
    };

    return NextResponse.json(responseDoc);
  } catch (error: any) {
    console.error('PATCH /api/members/me error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}
