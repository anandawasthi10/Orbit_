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
    pendingMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Member',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MongooseTeam: any = mongoose.models.Team || mongoose.model('Team', TeamSchema);

const Team: any = {
  async findOne(query: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findOne(query);
    }
    return MongooseTeam.findOne(query)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async findAll() {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findAll();
    }
    return MongooseTeam.find()
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async findUserTeam(userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findUserTeam(userId);
    }
    return MongooseTeam.findOne({ 'members.user': userId })
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async findAvailableTeams(userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.findAvailableTeams(userId);
    }
    const teams = await MongooseTeam.find().populate('members.user', 'name avatarUrl email role');
    return teams.filter((t: any) => {
      const isMember = t.members.some((m: any) => {
        const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
        return String(uId) === String(userId);
      });
      return !isMember;
    });
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.create(data);
    }
    const created = await MongooseTeam.create(data);
    return MongooseTeam.findById(created._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async createTeamWithLeader(name: string, leaderUserId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.createTeamWithLeader(name, leaderUserId);
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const created = await MongooseTeam.create({
      name,
      code,
      createdBy: leaderUserId,
      members: [
        {
          user: leaderUserId,
          role: 'Team Leader',
          joinedAt: new Date(),
        },
      ],
      pendingMembers: [],
    });
    return MongooseTeam.findById(created._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async requestJoin(teamId: string, userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.requestJoin(teamId, userId);
    }

    const team = await MongooseTeam.findById(teamId);
    if (!team) throw new Error('Team not found');

    const isMember = team.members.some((m: any) => m.user.toString() === userId);
    if (isMember) throw new Error('Already a member of this team');

    const pendingIdx = team.pendingMembers.findIndex((p: any) => p.user.toString() === userId);
    if (pendingIdx !== -1) {
      team.pendingMembers[pendingIdx].status = 'pending';
      team.pendingMembers[pendingIdx].requestedAt = new Date();
    } else {
      team.pendingMembers.push({
        user: userId,
        requestedAt: new Date(),
        status: 'pending',
      });
    }

    await team.save();
    return MongooseTeam.findById(team._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async approveMemberRequest(teamId: string, userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.approveMemberRequest(teamId, userId);
    }

    const team = await MongooseTeam.findById(teamId);
    if (!team) throw new Error('Team not found');

    // Remove from pendingMembers
    team.pendingMembers = (team.pendingMembers || []).filter(
      (p: any) => p.user.toString() !== userId
    );

    // Add to members if not already
    const isMember = team.members.some((m: any) => m.user.toString() === userId);
    if (!isMember) {
      team.members.push({
        user: userId,
        role: 'Member',
        joinedAt: new Date(),
      });
    }

    await team.save();
    return MongooseTeam.findById(team._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async rejectMemberRequest(teamId: string, userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.rejectMemberRequest(teamId, userId);
    }

    const team = await MongooseTeam.findById(teamId);
    if (!team) throw new Error('Team not found');

    const pendingIdx = team.pendingMembers.findIndex((p: any) => p.user.toString() === userId);
    if (pendingIdx !== -1) {
      team.pendingMembers[pendingIdx].status = 'rejected';
    }

    await team.save();
    return MongooseTeam.findById(team._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async addMemberByCode(code: string, userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.addMemberByCode(code, userId);
    }

    const team = await MongooseTeam.findOne({ code: code.toUpperCase().trim() });
    if (!team) {
      throw new Error('Invalid team code');
    }

    const alreadyIn = team.members.some((m: any) => m.user.toString() === userId);
    if (alreadyIn) {
      throw new Error('User is already a member of this team');
    }

    team.members.push({
      user: userId,
      role: 'Member',
      joinedAt: new Date(),
    });

    await team.save();
    return MongooseTeam.findById(team._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },

  async removeMember(teamId: string, userId: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileTeamStore.removeMember(teamId, userId);
    }

    const team = await MongooseTeam.findById(teamId);
    if (!team) return null;

    team.members = team.members.filter((m: any) => m.user.toString() !== userId);

    if (team.members.length === 0) {
      await MongooseTeam.findByIdAndDelete(teamId);
      return { message: 'Team deleted as all members left' };
    }

    await team.save();
    return MongooseTeam.findById(team._id)
      .populate('members.user', 'name avatarUrl email role')
      .populate('pendingMembers.user', 'name avatarUrl email role');
  },
};

export default Team;
