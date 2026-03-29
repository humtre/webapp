import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllLikes, adjustLikes } from '../_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const likes = await getAllLikes();
    return res.status(200).json({ likes });
  }

  if (req.method === 'PUT') {
    const { id, delta } = req.body as { id: string; delta: number };
    if (!id || (delta !== 1 && delta !== -1)) {
      return res.status(400).json({ error: '`id` and `delta` (1 or -1) required' });
    }
    const likes = await adjustLikes(id, delta);
    return res.status(200).json({ id, likes });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
