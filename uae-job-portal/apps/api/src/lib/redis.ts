import IORedis from 'ioredis';
import { config } from '../config';

export const redis = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  console.error('[Redis] connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] connected');
});

export default redis;
