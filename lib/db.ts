import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamos';

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isFallback: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: CachedConnection | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, isFallback: false };
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (cached!.isFallback) {
    return null;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // 3s fast timeout
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (e: any) {
    console.warn('MongoDB connection failed. Switching to local file database storage:', e.message);
    cached!.promise = null;
    cached!.isFallback = true;
    return null;
  }
}

export function isFallbackMode(): boolean {
  return Boolean(cached!.isFallback);
}

export default connectDB;
