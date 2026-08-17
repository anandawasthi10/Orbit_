import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileResourceStore } from '@/lib/fileDb';

const ResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Documentation', 'Design', 'Tools', 'Reference', 'Other'],
      default: 'Other',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseResource =
  mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);

const Resource = {
  async find(query = {}) {
    await connectDB();
    if (isFallbackMode()) {
      return FileResourceStore.find(query);
    }
    return MongooseResource.find(query)
      .populate('addedBy', 'name avatarUrl role email')
      .sort({ createdAt: -1 });
  },

  async findById(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileResourceStore.findById(id);
    }
    return MongooseResource.findById(id).populate(
      'addedBy',
      'name avatarUrl role email'
    );
  },

  async create(data) {
    await connectDB();
    if (isFallbackMode()) {
      return FileResourceStore.create(data);
    }
    const created = await MongooseResource.create(data);
    return MongooseResource.findById(created._id).populate(
      'addedBy',
      'name avatarUrl role email'
    );
  },

  async findByIdAndDelete(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileResourceStore.findByIdAndDelete(id);
    }
    return MongooseResource.findByIdAndDelete(id);
  },
};

export default Resource;
