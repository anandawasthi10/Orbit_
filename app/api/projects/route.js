import { NextResponse } from 'next/server';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function GET() {
  try {
    const projects = await Project.find({});
    const tasks = await Task.find({});

    const formattedProjects = projects.map((p) => {
      const projIdStr = p._id ? p._id.toString() : p.id;
      const projTasks = tasks.filter((t) => {
        if (!t.projectId) return false;
        const tProjId = typeof t.projectId === 'object' ? (t.projectId._id || t.projectId.id) : t.projectId;
        return String(tProjId) === String(projIdStr);
      });

      const completedCount = projTasks.filter((t) => t.status === 'completed').length;

      return {
        _id: projIdStr,
        id: projIdStr,
        name: p.name,
        description: p.description || '',
        status: p.status || 'active',
        totalTasks: projTasks.length,
        completedTasks: completedCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json(formattedProjects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const newProject = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      status: status && ['planning', 'active', 'completed'].includes(status) ? status : 'active',
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
