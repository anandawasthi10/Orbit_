import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileNotificationStore } from '@/lib/fileDb';

const NotificationSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      default: 'all', // "all" or specific admin member ID
    },
    submitterName: {
      type: String,
      default: '',
    },
    taskTitle: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    taskId: {
      type: String,
      default: '',
    },
    submissionId: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseNotification: any =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

const Notification: any = {
  find(query: any = {}) {
    if (isFallbackMode()) {
      return FileNotificationStore.find(query);
    }
    return MongooseNotification.find(query).sort({ createdAt: -1 });
  },

  async create(data: any) {
    await connectDB();
    if (isFallbackMode()) {
      return FileNotificationStore.create(data);
    }
    return MongooseNotification.create(data);
  },

  async markAsRead(id?: string) {
    await connectDB();
    if (isFallbackMode()) {
      return FileNotificationStore.markAsRead(id);
    }
    if (id) {
      return MongooseNotification.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true });
    }
    return MongooseNotification.updateMany({ isRead: false }, { $set: { isRead: true } });
  },
};

export default Notification;
