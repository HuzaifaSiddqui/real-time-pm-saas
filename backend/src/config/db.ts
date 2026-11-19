import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export const connectDB = async (): Promise<void> => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI);
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}):`, error);
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
};
