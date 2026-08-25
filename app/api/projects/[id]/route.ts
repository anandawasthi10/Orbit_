import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';

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
    const id = await getParamId(props);
    await connectDB();
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await getParamId(props);
    const updates = await req.json();
    await connectDB();

    const updatedProject = await Project.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error('PATCH /api/projects/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await getParamId(props);
    await connectDB();
    await Project.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
