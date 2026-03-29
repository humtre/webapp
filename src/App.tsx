import { useState, useEffect, useCallback } from 'react';
import { usePlayer }  from '@/hooks/usePlayer';
import { useLikes }   from '@/hooks/useLikes';
import Sidebar        from '@/components/Sidebar';
import MainView       from '@/components/MainView';
import PlayerBar      from '@/components/PlayerBar';
import type { Track } from '@/types';
import styles         from '@/styles/Layout.module.css';

export const SEARCH_SERVICE =
  import.meta.env.VITE_SEARCH_SERVICE_URL ?? 'http://localhost:8000';

async function fetchPlaylist(): Promise<Track[]> {
  const res  = await fetch(`${SEARCH_SERVICE}/api/playlist`);
  if (!res.ok) throw new Error(`playlist fetch failed: ${res.status}`);
  const data = await res.json() as { id: string; blob_name: string }[];
  return data.map((t) => ({ id: t.id, blobName: t.blob_name }));
}

export default function App() {
  const [playlist,    setPlaylist]    = useState<Track[]>([]);
  const [error,       setError]       = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchPlaylist().then(setPlaylist).catch((e) => setError(String(e)));
  }, []);

  const likes  = useLikes();
  const player = usePlayer(playlist, likes.likesMap);
  const track  = playlist[player.curIdx];

  // 'f' = +1 like, 'F' (shift+f) = -1 like
  const handleLikeKey = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return;
    if (!track) return;
    if (e.key === 'f') { e.preventDefault(); likes.addLike(track.id); }
    if (e.key === 'F') { e.preventDefault(); likes.removeLike(track.id); }
  }, [track, likes]);
  useEffect(() => {
    window.addEventListener('keydown', handleLikeKey);
    return () => window.removeEventListener('keydown', handleLikeKey);
  }, [handleLikeKey]);

  if (error) return <div className={styles.err}>{error}</div>;

  // <audio> is rendered unconditionally so usePlayer's event listeners
  // (timeupdate, loadedmetadata, etc.) attach on the first render,
  // before the playlist arrives.
  return (
    <div className={styles.layout}>
      <audio ref={player.audioRef} preload="auto" />

      {!playlist.length ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <>
          {sidebarOpen && (
            <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
          )}

          <Sidebar
            playlist={playlist}
            curIdx={player.curIdx}
            isOpen={sidebarOpen}
            getLikes={likes.getLikes}
            onSelect={(i) => { player.jumpTo(i); setSidebarOpen(false); }}
            onClose={() => setSidebarOpen(false)}
          />

          <MainView
            track={track}
            trackIndex={player.curIdx}
            isPlaying={player.isPlaying}
            likes={track ? likes.getLikes(track.id) : 0}
            onLike={() => track && likes.addLike(track.id)}
            onUnlike={() => track && likes.removeLike(track.id)}
          />

          <PlayerBar
            track={track}
            trackIndex={player.curIdx}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            volume={player.volume}
            shuffleMode={player.shuffleMode}
            likes={track ? likes.getLikes(track.id) : 0}
            onLike={() => track && likes.addLike(track.id)}
            onUnlike={() => track && likes.removeLike(track.id)}
            onTogglePlay={player.togglePlay}
            onNext={player.next}
            onPrev={player.prev}
            onSeek={player.seek}
            onVolumeChange={player.changeVolume}
            onCycleShuffleMode={player.cycleShuffleMode}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
          />
        </>
      )}
    </div>
  );
}
