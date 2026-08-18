import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileSubmissionStore } from '@/lib/fileDb';

const SubmissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Submitter ID is required'],
    },
    link: {
      type: String,
      required: [true, 'Submission link URL is required'],
      trim: true,
    },
    screenshotUrl: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'rejected'],
      default: 'submitted',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseSubmission: any =
  mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

const Submission: any = {
  find(query: any = {}) {
    if (isFallbackMode()) {
      return FileSubmissionStore.find(query);
    }
    return MongooseSubmission.find(query)
      .populate('submittedBy', 'name avatarUrl role email')
      .populate('taskId', 'title category priority status')
      .sort({ createdAt: -1 });
  },

  async findById(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileSubmissionStore.findById(id);
    }
    return MongooseSubmission.findById(id)
      .populate('submittedBy', 'name avatarUrl role email')
      .populate('taskId', 'title category priority status');
  },

  async findOne(query: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileSubmissionStore.findOne(query);
    }
    return MongooseSubmission.findOne(query)
      .populate('submittedBy', 'name avatarUrl role email')
      .populate('taskId', 'title category priority status');
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileSubmissionStore.create(data);
    }
    const created = await MongooseSubmission.create(data);
    return MongooseSubmission.findById(created._id)
      .populate('submittedBy', 'name avatarUrl role email')
      .populate('taskId', 'title category priority status');
  },

  async findByIdAndUpdate(id: string, update: any, options = { new: true }) {
    await connectDB();
    if (isFallbackMode()) {
      return FileSubmissionStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseSubmission.findByIdAndUpdate(id, update, options)
      .populate('submittedBy', 'name avatarUrl role email')
      .populate('taskId', 'title category priority status');
  },

  async findByIdAndDelete(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileSubmissionStore.findByIdAndDelete(id);
    }
    return MongooseSubmission.findByIdAndDelete(id);
  },
};

export default Submission;
