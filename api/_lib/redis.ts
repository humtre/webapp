import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// KV schema:
//   track:likes:{id} → number (0+)

export async function getAllLikes(): Promise<Record<string, number>> {
  const keys = await redis.keys('track:likes:*');
  if (!keys.length) return {};

  const values = await redis.mget<(number | null)[]>(...keys);
  const result: Record<string, number> = {};
  keys.forEach((key, i) => {
    const id = key.replace('track:likes:', '');
    const v  = values[i] ?? 0;
    if (v > 0) result[id] = v;
  });
  return result;
}

export async function adjustLikes(trackId: string, delta: number): Promise<number> {
  const key = `track:likes:${trackId}`;
  const next = await redis.incrby(key, delta);
  // Floor at 0
  if (next < 0) { await redis.set(key, 0); return 0; }
  return next;
}
