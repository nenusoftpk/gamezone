import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gamezone";
const cache = globalThis.mongooseCache || { connection: null, promise: null };
globalThis.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri).then((connection) => connection).catch((error) => {
      cache.promise = null;
      throw error;
    });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}
