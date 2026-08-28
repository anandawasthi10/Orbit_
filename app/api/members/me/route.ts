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

    // Clean up previous avatar files for this member with different extensions
    const possibleExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico'];
    for (const otherExt of possibleExts) {
      const oldPath = path.join(uploadsDir, `avatar-${memberId}.${otherExt}`);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (_) {}
      }
    }

    const fileName = `avatar-${memberId}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${fileName}?v=${Date.now()}`;
  } catch (err) {
    console.error('tryWriteAvatarToDisk error:', err);
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
    const memberId = (session.user as any).id;

    if (memberDoc.avatarUrl && (memberDoc.avatarUrl.startsWith('data:') || memberDoc.avatarUrl.length > 300)) {
      memberDoc.avatarUrl = `/api/members/${memberId}/avatar?v=${Date.now()}`;
    }

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

    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().toLowerCase().startsWith('data:image/')) {
      const commaIndex = avatarUrl.indexOf(',');
      if (commaIndex !== -1) {
        const header = avatarUrl.substring(0, commaIndex);
        const base64Data = avatarUrl.substring(commaIndex + 1);
        const mimeMatch = header.match(/data:image\/([a-zA-Z0-9+.-]+)/i);
        let ext = mimeMatch ? mimeMatch[1].toLowerCase() : 'png';
        if (ext === 'jpeg') ext = 'jpg';
        if (ext.includes('svg')) ext = 'svg';

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico'];
        if (allowedExtensions.includes(ext)) {
          // 1. Try to write to disk (works in local dev & persistent server)
          const diskUrl = await tryWriteAvatarToDisk(base64Data, ext, memberId);

          if (diskUrl) {
            updateFields.avatarUrl = diskUrl;
          } else {
            // Serverless fallback: store in database
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

    const safeDoc = {
      ...updatedDoc,
      avatarUrl:
        updatedDoc.avatarUrl && (updatedDoc.avatarUrl.startsWith('data:') || updatedDoc.avatarUrl.length > 300)
          ? `/api/members/${memberId}/avatar?v=${Date.now()}`
          : updatedDoc.avatarUrl || '',
    };

    return NextResponse.json(safeDoc);
  } catch (error: any) {
    console.error('PATCH /api/members/me error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}
