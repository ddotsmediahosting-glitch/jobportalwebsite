type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

export function enforceRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  store.set(key, bucket);

  return { allowed: true, remaining: Math.max(maxRequests - bucket.count, 0) };
}
