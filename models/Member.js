import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileMemberStore } from '@/lib/fileDb';

const MemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      default: 'Team Member',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    completionPercent: {
      type: Number,
      default: 0,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Delete password when converting to JSON by default
MemberSchema.methods.toJSON = function () {
  const member = this.toObject();
  delete member.password;
  return member;
};

const MongooseMember = mongoose.models.Member || mongoose.model('Member', MemberSchema);

// Smart Member Proxy supporting both Mongoose and File Storage Fallback
const Member = {
  async findOne(query) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findOne(query);
    }
    return MongooseMember.findOne(query);
  },

  async findById(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findById(id);
    }
    return MongooseMember.findById(id);
  },

  async create(data) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.create(data);
    }
    return MongooseMember.create(data);
  },

  async findByIdAndUpdate(id, update, options) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseMember.findByIdAndUpdate(id, update, options);
  },

  find(query) {
    if (isFallbackMode()) {
      return FileMemberStore.find(query);
    }
    return MongooseMember.find(query);
  },
};

export default Member;
