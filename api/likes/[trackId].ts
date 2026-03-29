import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adjustLikes } from '../_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const trackId = decodeURIComponent(req.query.trackId as string);
  const { delta } = req.body as { delta: number };

  if (typeof delta !== 'number' || (delta !== 1 && delta !== -1)) {
    return res.status(400).json({ error: '`delta` must be 1 or -1' });
  }

  const likes = await adjustLikes(trackId, delta);
  return res.status(200).json({ id: trackId, likes });
}
