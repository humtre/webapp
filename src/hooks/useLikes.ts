import { useState, useEffect, useCallback } from 'react';

export interface LikesState {
  likesMap:   Map<string, number>;
  getLikes:   (id: string) => number;
  addLike:    (id: string) => void;
  removeLike: (id: string) => void;
  loading:    boolean;
}

export function useLikes(): LikesState {
  const [likesMap, setLikesMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/likes')
      .then((r) => r.json())
      .then((data: { likes: Record<string, number> }) => {
        setLikesMap(new Map(Object.entries(data.likes)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Default 1 like per track; KV stores overrides (0 = explicitly removed, 2+ = extra likes)
  const getLikes = useCallback((id: string) => likesMap.has(id) ? likesMap.get(id)! : 1, [likesMap]);

  const adjust = useCallback((id: string, delta: 1 | -1) => {
    const prev = likesMap.get(id) ?? 0;
    const next = Math.max(0, prev + delta);

    // Optimistic update
    setLikesMap((m) => { const n = new Map(m); n.set(id, next); return n; });

    // Sync to server (revert on failure)
    fetch('/api/likes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta }),
    }).catch(() => {
      setLikesMap((m) => { const n = new Map(m); n.set(id, prev); return n; });
    });
  }, [likesMap]);

  const addLike    = useCallback((id: string) => adjust(id, 1),  [adjust]);
  const removeLike = useCallback((id: string) => adjust(id, -1), [adjust]);

  return { likesMap, getLikes, addLike, removeLike, loading };
}
