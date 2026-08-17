import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Member from '@/models/Member';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const member = await Member.findById(session.user.id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const memberDoc = member.toJSON ? member.toJSON() : member;
    return NextResponse.json(memberDoc);
  } catch (error) {
    console.error('GET /api/members/me error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, role, bio, skills, avatarUrl } = await req.json();

    await connectDB();

    // Handle skills formatting: if string, split by comma; if array, trim items
    let parsedSkills = [];
    if (typeof skills === 'string') {
      parsedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
    }

    const updateFields = {
      profileComplete: true,
      completionPercent: 100,
    };

    if (name !== undefined && name.trim() !== '') updateFields.name = name.trim();
    if (role !== undefined) updateFields.role = role.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    updateFields.skills = parsedSkills;

    // Handle uploaded base64 avatar images by saving them to public/uploads/ on disk
    if (avatarUrl && avatarUrl.startsWith('data:image/')) {
      try {
        const matches = avatarUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const fileName = `avatar-${session.user.id}.${ext}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, buffer);

          // Short URL path pointing to static file in public/uploads/
          updateFields.avatarUrl = `/uploads/${fileName}?v=${Date.now()}`;
        }
      } catch (err) {
        console.error('Error saving avatar image to disk:', err);
      }
    } else if (avatarUrl !== undefined) {
      updateFields.avatarUrl = avatarUrl.trim();
    }

    const updatedMember = await Member.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const updatedDoc = updatedMember.toJSON ? updatedMember.toJSON() : updatedMember;
    return NextResponse.json(updatedDoc);
  } catch (error) {
    console.error('PATCH /api/members/me error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  return PATCH(req);
}
