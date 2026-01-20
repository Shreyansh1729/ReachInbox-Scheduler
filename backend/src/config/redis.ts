import IORedis from 'ioredis';
import { env } from '../config/env';

export const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

console.log(`Updated - Redis connected to ${env.REDIS_URL}`);
