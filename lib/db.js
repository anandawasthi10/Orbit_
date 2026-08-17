import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamos';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, isFallback: false };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (cached.isFallback) {
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // 3s fast timeout
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    console.warn('MongoDB connection failed. Switching to local file database storage:', e.message);
    cached.promise = null;
    cached.isFallback = true;
    return null;
  }
}

export function isFallbackMode() {
  return cached.isFallback;
}

export default connectDB;
