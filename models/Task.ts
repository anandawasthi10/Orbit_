import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileTaskStore } from '@/lib/fileDb';

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Research', 'Frontend', 'Backend', 'DevOps', 'UI/UX', 'Documentation', 'General'],
      default: 'General',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'pending', 'submitted', 'approved', 'rejected'],
      default: 'todo',
    },
    deadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseTask: any = mongoose.models.Task || mongoose.model('Task', TaskSchema);

const Task: any = {
  find(query: any = {}) {
    if (isFallbackMode()) {
      return FileTaskStore.find(query);
    }
    return MongooseTask.find(query)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('assignedBy', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async findById(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.findById(id);
    }
    return MongooseTask.findById(id)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('assignedBy', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.create(data);
    }
    const created = await MongooseTask.create(data);
    return MongooseTask.findById(created._id)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('assignedBy', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async findByIdAndUpdate(id: string, update: any, options = { new: true }) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseTask.findByIdAndUpdate(id, update, options)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('assignedBy', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async findByIdAndDelete(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.findByIdAndDelete(id);
    }
    return MongooseTask.findByIdAndDelete(id);
  },
};

export default Task;
