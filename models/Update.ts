import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileUpdateStore } from '@/lib/fileDb';

const UpdateSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    message: {
      type: String,
      required: [true, 'Update message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['task_completed', 'member_joined', 'general', 'progress', 'blocker', 'announcement'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

const MongooseUpdate: any = mongoose.models.Update || mongoose.model('Update', UpdateSchema);

const Update: any = {
  find(query: any = {}) {
    if (isFallbackMode()) {
      return FileUpdateStore.find(query);
    }
    return MongooseUpdate.find(query)
      .populate('author', 'name avatarUrl role email')
      .sort({ createdAt: -1 });
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileUpdateStore.create(data);
    }
    const created = await MongooseUpdate.create(data);
    return MongooseUpdate.findById(created._id).populate('author', 'name avatarUrl role email');
  },

  async findByIdAndDelete(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileUpdateStore.findByIdAndDelete(id);
    }
    return MongooseUpdate.findByIdAndDelete(id);
  },
};

export default Update;
