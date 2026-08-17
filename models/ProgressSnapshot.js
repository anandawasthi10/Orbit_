import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileProgressSnapshotStore } from '@/lib/fileDb';

const ProgressSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Snapshot date is required'],
    },
    dateStr: {
      type: String,
      required: true,
      index: true,
    },
    plannedPercent: {
      type: Number,
      default: 0,
    },
    actualPercent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseProgressSnapshot =
  mongoose.models.ProgressSnapshot ||
  mongoose.model('ProgressSnapshot', ProgressSnapshotSchema);

const ProgressSnapshot = {
  async find(query = {}) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProgressSnapshotStore.find(query);
    }
    return MongooseProgressSnapshot.find(query).sort({ date: 1 });
  },

  async upsertToday({ dateStr, date, plannedPercent, actualPercent }) {
    await connectDB();
    if (isFallbackMode()) {
      return FileProgressSnapshotStore.upsertToday({
        dateStr,
        date,
        plannedPercent,
        actualPercent,
      });
    }

    return MongooseProgressSnapshot.findOneAndUpdate(
      { dateStr },
      { $set: { date, dateStr, plannedPercent, actualPercent } },
      { upsert: true, new: true }
    );
  },
};

export default ProgressSnapshot;
