import IORedis from 'ioredis';
import { config } from '../config';

export const redis = new IORedis(config.redis.url, {
  maxRetriesPerRequest: 0,  // fail fast so cache misses don't block requests
  enableReadyCheck: false,
  connectTimeout: 2000,     // 2 s connect timeout
  commandTimeout: 1000,     // 1 s per command
});

redis.on('error', (err) => {
  console.error('[Redis] connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] connected');
});

export default redis;
