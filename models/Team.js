import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileTeamStore } from '@/lib/fileDb';

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Team code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Member',
          required: true,
        },
        role: {
          type: String,
          default: 'Member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MongooseTeam =
  mongoose.models.Team || mongoose.model('Team', TeamSchema);

export function generateTeamCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const Team = {
  async findOne(query = {}) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findOne(query);
    }
    return MongooseTeam.findOne(query).populate('members.user', 'name avatarUrl email role');
  },

  async findUserTeam(userId) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findUserTeam(userId);
    }
    return MongooseTeam.findOne({ 'members.user': userId }).populate(
      'members.user',
      'name avatarUrl email role'
    );
  },

  async create(data) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.create(data);
    }
    return MongooseTeam.create(data);
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findByIdAndUpdate(id, update, options);
    }
    return MongooseTeam.findByIdAndUpdate(id, update, options).populate(
      'members.user',
      'name avatarUrl email role'
    );
  },

  async findByIdAndDelete(id) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findByIdAndDelete(id);
    }
    return MongooseTeam.findByIdAndDelete(id);
  },
};

export default Team;
