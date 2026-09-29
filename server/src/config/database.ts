import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let inMemoryMongo: any = null;

export async function connectDatabase(): Promise<string> {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    try {
      logger.info('Connecting to configured MongoDB URI...', { uri: uri.replace(/:([^@]+)@/, ':****@') });
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('Connected successfully to remote MongoDB / Atlas');
      return uri;
    } catch (err: any) {
      logger.warn(`Remote MongoDB connection failed (${err.message}). Falling back to in-memory MongoDB for local evaluation...`);
    }
  } else {
    logger.info('No MONGODB_URI provided in environment. Initializing local in-memory MongoDB instance for local demonstration...');
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    inMemoryMongo = await MongoMemoryServer.create();
    const memoryUri = inMemoryMongo.getUri();
    await mongoose.connect(memoryUri);
    logger.info('Connected to In-Memory MongoDB successfully', { uri: memoryUri });
    return memoryUri;
  } catch (memErr: any) {
    logger.error('Failed to initialize in-memory MongoDB', { error: memErr.message });
    throw memErr;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (inMemoryMongo) {
      await inMemoryMongo.stop();
    }
    logger.info('MongoDB disconnected cleanly');
  } catch (err: any) {
    logger.error('Error during MongoDB disconnect', { error: err.message });
  }
}
