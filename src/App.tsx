import { useState, useEffect } from 'react';
import { usePlayer }  from '@/hooks/usePlayer';
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

  const player = usePlayer(playlist);
  const track  = playlist[player.curIdx];

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
            onSelect={(i) => { player.jumpTo(i); setSidebarOpen(false); }}
            onClose={() => setSidebarOpen(false)}
          />

          <MainView
            track={track}
            trackIndex={player.curIdx}
            isPlaying={player.isPlaying}
          />

          <PlayerBar
            track={track}
            trackIndex={player.curIdx}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            volume={player.volume}
            shuffle={player.shuffle}
            onTogglePlay={player.togglePlay}
            onNext={player.next}
            onPrev={player.prev}
            onSeek={player.seek}
            onVolumeChange={player.changeVolume}
            onToggleShuffle={player.toggleShuffle}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
          />
        </>
      )}
    </div>
  );
}
