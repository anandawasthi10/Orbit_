import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileProjectStore } from '@/lib/fileDb';

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const MongooseProject =
  mongoose.models.Project || mongoose.model('Project', ProjectSchema);

const Project = {
  async find(query = {}) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProjectStore.find(query);
    }
    return MongooseProject.find(query).sort({ createdAt: -1 });
  },

  async findById(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProjectStore.findById(id);
    }
    return MongooseProject.findById(id);
  },

  async create(data) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProjectStore.create(data);
    }
    return MongooseProject.create(data);
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProjectStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseProject.findByIdAndUpdate(id, update, options);
  },

  async findByIdAndDelete(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProjectStore.findByIdAndDelete(id);
    }
    return MongooseProject.findByIdAndDelete(id);
  },
};

export default Project;
