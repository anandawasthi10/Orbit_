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

MemberSchema.methods.toJSON = function () {
  const member = this.toObject();
  delete member.password;
  return member;
};

const MongooseMember: any = mongoose.models.Member || mongoose.model('Member', MemberSchema);

const Member: any = {
  async findOne(query: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findOne(query);
    }
    return MongooseMember.findOne(query);
  },

  async findById(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findById(id);
    }
    return MongooseMember.findById(id);
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.create(data);
    }
    return MongooseMember.create(data);
  },

  async findByIdAndUpdate(id: string, update: any, options?: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseMember.findByIdAndUpdate(id, update, options);
  },

  async findByIdAndDelete(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileMemberStore.findByIdAndDelete(id);
    }
    return MongooseMember.findByIdAndDelete(id);
  },

  find(query?: any) {
    if (isFallbackMode()) {
      return FileMemberStore.find(query);
    }
    return MongooseMember.find(query);
  },
};

export default Member;
