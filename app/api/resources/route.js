import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Resource from '@/models/Resource';
import Member from '@/models/Member';

export async function GET() {
  try {
    const resources = await Resource.find({});
    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { title, url, category } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Resource title is required' },
        { status: 400 }
      );
    }

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'Resource URL is required' },
        { status: 400 }
      );
    }

    let addedById = null;
    if (session?.user?.email) {
      const currentMember = await Member.findOne({ email: session.user.email });
      if (currentMember) {
        addedById = currentMember._id ? currentMember._id.toString() : currentMember.id;
      }
    }

    const newResource = await Resource.create({
      title: title.trim(),
      url: url.trim(),
      category: category && ['Documentation', 'Design', 'Tools', 'Reference', 'Other'].includes(category)
        ? category
        : 'Other',
      addedBy: addedById,
    });

    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
