import mongoose from 'mongoose';
import connectDB, { isFallbackMode } from '@/lib/db';
import { FileUpdateStore } from '@/lib/fileDb';

// Flat embedded author — no ObjectId ref needed, no populate needed.
const UpdateSchema = new mongoose.Schema(
  {
    authorId: { type: String, default: '' },
    authorName: { type: String, default: 'Teammate', trim: true },
    authorRole: { type: String, default: 'Team Member' },
    authorAvatar: { type: String, default: '' },
    authorEmail: { type: String, default: '' },
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
    isoCreatedAt: { type: String },
    // Keep old author field as Mixed for backward compatibility
    author: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const MongooseUpdate: any =
  mongoose.models.Update || mongoose.model('Update', UpdateSchema);

function normalizeDoc(d: any): any {
  if (!d) return d;
  const doc = d.toObject ? d.toObject() : { ...d };

  const populatedAuthor =
    doc.author && typeof doc.author === 'object' && !Array.isArray(doc.author) && doc.author.name
      ? doc.author
      : null;

  doc.author = {
    _id: doc.authorId || populatedAuthor?._id || '',
    id: doc.authorId || populatedAuthor?._id || '',
    name: doc.authorName || populatedAuthor?.name || 'Teammate',
    role: doc.authorRole || populatedAuthor?.role || 'Team Member',
    avatarUrl: doc.authorAvatar || populatedAuthor?.avatarUrl || '',
    email: doc.authorEmail || populatedAuthor?.email || '',
  };

  return doc;
}

// Exported as standalone functions to avoid TypeScript issues with async methods in object literals

export async function findUpdates(query: any = {}): Promise<any[]> {
  await connectDB();
  if (isFallbackMode()) {
    const results = FileUpdateStore.find(query);
    return Array.isArray(results) ? results : [];
  }
  const raw: any[] = await MongooseUpdate.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
    .exec();
  return raw.map(normalizeDoc);
}

export async function createUpdate(data: any): Promise<any> {
  await connectDB();
  if (isFallbackMode()) {
    return FileUpdateStore.create(data);
  }
  const now = new Date().toISOString();
  const doc = await MongooseUpdate.create({
    authorId: data.authorId || data.author?._id || data.author?.id || '',
    authorName: data.authorName || data.author?.name || 'Teammate',
    authorRole: data.authorRole || data.author?.role || 'Team Member',
    authorAvatar: data.authorAvatar || data.author?.avatarUrl || '',
    authorEmail: data.authorEmail || data.author?.email || '',
    message: data.message,
    type: data.type || 'general',
    isoCreatedAt: now,
  });
  return normalizeDoc(doc);
}

export async function deleteUpdate(id: string): Promise<any> {
  await connectDB();
  if (isFallbackMode()) {
    return FileUpdateStore.findByIdAndDelete(id);
  }
  return MongooseUpdate.findByIdAndDelete(id);
}

// Default export as object for backward compatibility
const Update = {
  find: findUpdates,
  create: createUpdate,
  findByIdAndDelete: deleteUpdate,
};

export default Update;
