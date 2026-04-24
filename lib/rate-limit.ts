import { Redis } from "@upstash/redis";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const store = getStore();
let redisClient: Redis | null | undefined;

function getStore(): Map<string, Bucket> {
  const globalStore = globalThis as typeof globalThis & {
    __askRateLimitStore?: Map<string, Bucket>;
  };

  if (!globalStore.__askRateLimitStore) {
    globalStore.__askRateLimitStore = new Map();
  }

  return globalStore.__askRateLimitStore;
}

export async function takeRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (redis) {
    return takeRedisRateLimit(redis, key, opts);
  }

  return takeMemoryRateLimit(key, opts);
}

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

async function takeRedisRateLimit(
  redis: Redis,
  key: string,
  opts: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(opts.windowMs / 1000));
  const storageKey = `rate-limit:${key}`;
  const count = await redis.incr(storageKey);

  if (count === 1) {
    await redis.expire(storageKey, windowSeconds);
  }

  const ttl = Math.max(0, Number(await redis.ttl(storageKey)));
  const retryAfterSeconds = Math.max(1, ttl || windowSeconds);
  const allowed = count <= opts.limit;

  return {
    allowed,
    limit: opts.limit,
    remaining: allowed ? Math.max(0, opts.limit - count) : 0,
    resetAt: Date.now() + retryAfterSeconds * 1000,
    retryAfterSeconds,
  };
}

function takeMemoryRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - 1),
      resetAt,
      retryAfterSeconds: Math.ceil(opts.windowMs / 1000),
    };
  }

  if (current.count >= opts.limit) {
    return {
      allowed: false,
      limit: opts.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
