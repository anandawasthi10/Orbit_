import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Task from '@/models/Task';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const [projects, tasks] = await Promise.all([Project.find({}), Task.find({})]);

    const formattedProjects = projects.map((p: any) => {
      const pId = String(p._id || p.id);
      const projectTasks = tasks.filter((t: any) => {
        if (!t.projectId) return false;
        const taskProjId = typeof t.projectId === 'object' ? String(t.projectId._id || t.projectId.id) : String(t.projectId);
        return taskProjId === pId;
      });

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter((t: any) => t.status === 'completed').length;

      return {
        ...p,
        _id: pId,
        id: pId,
        totalTasks,
        completedTasks,
      };
    });

    return NextResponse.json(formattedProjects);
  } catch (error: any) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, status } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const newProject = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      status: status || 'active',
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
