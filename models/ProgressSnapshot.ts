import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileProgressSnapshotStore } from '@/lib/fileDb';

const ProgressSnapshotSchema = new mongoose.Schema(
  {
    dateStr: {
      type: String,
      required: true,
      unique: true, // e.g. "2026-08-15"
    },
    date: {
      type: Date,
      required: true,
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

const MongooseProgressSnapshot: any =
  mongoose.models.ProgressSnapshot ||
  mongoose.model('ProgressSnapshot', ProgressSnapshotSchema);

const ProgressSnapshot: any = {
  find(query: any = {}) {
    if (isFallbackMode()) {
      return FileProgressSnapshotStore.find(query);
    }
    return MongooseProgressSnapshot.find(query).sort({ date: 1 });
  },

  async upsertToday({ dateStr, date, plannedPercent, actualPercent }: { dateStr: string; date: string | Date; plannedPercent: number; actualPercent: number }) {
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
      {
        $set: {
          date: new Date(date),
          plannedPercent,
          actualPercent,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },
};

export default ProgressSnapshot;
