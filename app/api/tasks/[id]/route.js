import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import Task from '@/models/Task';

import Member from '@/models/Member';

export const dynamic = 'force-dynamic';

async function isUserAdminOrLead(sessionUser) {
  if (!sessionUser) return false;
  const adminRoles = ['admin', 'team lead', 'lead', 'project manager', 'founder', 'ceo'];
  const userRole = (sessionUser.role || '').toLowerCase().trim();
  if (adminRoles.some((r) => userRole.includes(r))) {
    return true;
  }

  const allMembers = await Member.find({});
  if (allMembers.length > 0) {
    const firstMember = allMembers[0];
    const firstId = String(firstMember._id || firstMember.id);
    const currId = String(sessionUser.id || sessionUser._id);
    const firstEmail = firstMember.email?.toLowerCase().trim();
    const currEmail = sessionUser.email?.toLowerCase().trim();

    if (firstId === currId || (firstEmail && currEmail && firstEmail === currEmail)) {
      return true;
    }
  }

  return false;
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    await connectDB();

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Permission Check: Only Admin/Lead can assign/reassign tasks
    if (body.assignedTo !== undefined) {
      const existingAssignedId = existingTask.assignedTo
        ? String(existingTask.assignedTo._id || existingTask.assignedTo.id || existingTask.assignedTo)
        : null;
      const newAssignedId = body.assignedTo ? String(body.assignedTo) : null;

      if (existingAssignedId !== newAssignedId) {
        const isAdmin = await isUserAdminOrLead(session.user);
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Only the Admin or Team Lead can assign tasks to members.' },
            { status: 403 }
          );
        }
      }
    }

    // Permission Check: If updating status on an assigned task, enforce assigned member ownership
    if (body.status !== undefined && body.status !== existingTask.status) {
      if (existingTask.assignedTo) {
        const assignedObj = existingTask.assignedTo;
        const assignedId = String(assignedObj._id || assignedObj.id || assignedObj);
        const currentUserId = String(session.user.id || session.user._id);
        const currentUserEmail = session.user.email?.toLowerCase().trim();
        const assignedEmail = typeof assignedObj === 'object' ? assignedObj.email?.toLowerCase().trim() : null;

        const isAssignedUser =
          assignedId === currentUserId ||
          (currentUserEmail && assignedEmail && currentUserEmail === assignedEmail);

        if (!isAssignedUser) {
          return NextResponse.json(
            { error: `Only ${assignedObj.name || 'the assigned member'} can accept or change the status of this task.` },
            { status: 403 }
          );
        }
      }
    }

    const updateFields = {};
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.title !== undefined) updateFields.title = body.title.trim();
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.assignedTo !== undefined) updateFields.assignedTo = body.assignedTo || null;
    if (body.deadline !== undefined) {
      updateFields.deadline = body.deadline ? new Date(body.deadline) : null;
    }

    const updatedTask = await Task.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await connectDB();

    await Task.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
