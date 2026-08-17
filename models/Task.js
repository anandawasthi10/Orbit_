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
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed'],
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

const MongooseTask = mongoose.models.Task || mongoose.model('Task', TaskSchema);

// Smart Task Proxy supporting both Mongoose and File Storage Fallback
const Task = {
  async find(query = {}) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.find(query);
    }
    return MongooseTask.find(query)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async findById(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.findById(id);
    }
    return MongooseTask.findById(id)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async create(data) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.create(data);
    }
    const created = await MongooseTask.create(data);
    return MongooseTask.findById(created._id)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseTask.findByIdAndUpdate(id, update, options)
      .populate('assignedTo', 'name avatarUrl role email')
      .populate('projectId', 'name status');
  },

  async findByIdAndDelete(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTaskStore.findByIdAndDelete(id);
    }
    return MongooseTask.findByIdAndDelete(id);
  },
};

export default Task;
