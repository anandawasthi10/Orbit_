import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileAnnouncementStore } from '@/lib/fileDb';

const AnnouncementSchema = new mongoose.Schema(
  {
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    authorAvatar: { type: String, default: '' },
    authorRole: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    message: { type: String, required: true, trim: true },
    isoCreatedAt: { type: String },
  },
  { timestamps: true }
);

const MongooseAnnouncement: any =
  mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

const Announcement: any = {
  async find() {
    await connectDB();
    if (isFallbackMode()) {
      return FileAnnouncementStore.find();
    }
    return MongooseAnnouncement.find({}).sort({ createdAt: -1 }).limit(200);
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileAnnouncementStore.create(data);
    }
    return MongooseAnnouncement.create(data);
  },

  async findByIdAndDelete(id: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileAnnouncementStore.findByIdAndDelete(id);
    }
    return MongooseAnnouncement.findByIdAndDelete(id);
  },
};

export default Announcement;
