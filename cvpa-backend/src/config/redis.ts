import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✓ Redis connected successfully'));

export async function initializeRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('✗ Redis connection error:', error);
    // Redis is optional for MVP, so we'll continue without it
  }
}

