import { useRef, useState, useEffect } from 'react';
import type { Track } from '@/types';
import { SEARCH_SERVICE } from '@/App';
import { generateArtwork } from '@/constants/colors';

// Audio stream URL — the server proxies bytes from GCS so no signed key needed
function streamUrl(blobName: string): string {
  return `${SEARCH_SERVICE}/api/stream?blob_name=${encodeURIComponent(blobName)}`;
}

export type ShuffleMode = 'likes' | 'random' | 'sequential';

interface PlayerState {
  audioRef:       React.RefObject<HTMLAudioElement | null>;
  curIdx:         number;
  isPlaying:      boolean;
  currentTime:    number;
  duration:       number;
  volume:         number;
  shuffleMode:    ShuffleMode;
  togglePlay:     () => void;
  next:           () => void;
  prev:           () => void;
  jumpTo:         (i: number) => void;
  seek:           (t: number) => void;
  changeVolume:   (v: number) => void;
  cycleShuffleMode: () => void;
}

export function usePlayer(playlist: Track[], likesMap: Map<string, number>): PlayerState {
  const audioRef     = useRef<HTMLAudioElement>(null);
  const wantsPlayRef = useRef(false); // jumpTo() sets this so the track auto-plays on select

  const [curIdx,      setCurIdx]      = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(0.7);
  const [shuffleMode, setShuffleMode] = useState<ShuffleMode>('likes');

  // Mutable ref so audio event callbacks always see current values without stale closures
  const live = useRef({ curIdx: 0, shuffleMode: 'likes' as ShuffleMode, playlist: [] as Track[], likesMap: new Map<string, number>() });
  useEffect(() => { live.current.curIdx      = curIdx;      }, [curIdx]);
  useEffect(() => { live.current.shuffleMode = shuffleMode; }, [shuffleMode]);
  useEffect(() => { live.current.playlist = playlist; }, [playlist]);
  useEffect(() => { live.current.likesMap = likesMap; }, [likesMap]);

  function pickNext(from: number): number {
    const list = live.current.playlist;
    if (!list.length) return 0;
    if (live.current.shuffleMode === 'sequential') return (from + 1) % list.length;

    // 'likes' mode: weighted by likes count; 'random' mode: equal weight
    const likes = live.current.likesMap;
    const isLikesMode = live.current.shuffleMode === 'likes';
    const weights = list.map((t, i) =>
      i === from ? 0 : (isLikesMode ? (likes.has(t.id) ? likes.get(t.id)! : 1) : 1)
    );
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) return (from + 1) % list.length;

    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return (from + 1) % list.length;
  }

  // Attach audio element event listeners once on mount.
  // IMPORTANT: <audio> must be in the DOM on the very first render for this to work.
  // App.tsx renders <audio> unconditionally (outside the playlist-loaded check).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.7;

    const onTime  = () => setCurrentTime(audio.currentTime);
    const onMeta  = () => setDuration(audio.duration);
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      wantsPlayRef.current = true;
      const n = pickNext(live.current.curIdx);
      live.current.curIdx = n;
      setCurIdx(n);
    };

    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play',           onPlay);
    audio.addEventListener('pause',          onPause);
    audio.addEventListener('ended',          onEnded);
    return () => {
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play',           onPlay);
      audio.removeEventListener('pause',          onPause);
      audio.removeEventListener('ended',          onEnded);
    };
  }, []);

  // Pick a weighted-random first track when playlist loads
  const hasPickedFirst = useRef(false);
  useEffect(() => {
    if (hasPickedFirst.current || !playlist.length) return;
    hasPickedFirst.current = true;
    const first = pickNext(-1);
    live.current.curIdx = first;
    setCurIdx(first);
  }, [playlist, likesMap]);

  // Load a new track whenever the index or playlist changes
  useEffect(() => {
    const audio = audioRef.current;
    const track = playlist[curIdx];
    if (!audio || !track) return;

    const shouldPlay = !audio.paused || wantsPlayRef.current;
    wantsPlayRef.current = false;
    setCurrentTime(0);
    setDuration(0);

    audio.src = streamUrl(track.blobName);
    audio.load();
    if (shouldPlay) audio.play().catch(() => {});

    // Update document title and Media Session (PiP / lock screen)
    const likes = likesMap.has(track.id) ? likesMap.get(track.id)! : 1;
    document.title = likes > 0 ? `${track.id} · ♥ ${likes}` : track.id;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.id,
        artist: likes > 0 ? `♥ ${likes}` : '',
        artwork: [{ src: generateArtwork(curIdx), sizes: '256x256', type: 'image/png' }],
      });
      navigator.mediaSession.setActionHandler('play',  () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const p = (live.current.curIdx - 1 + live.current.playlist.length) % live.current.playlist.length;
        wantsPlayRef.current = true;
        live.current.curIdx = p;
        setCurIdx(p);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        wantsPlayRef.current = true;
        const n = pickNext(live.current.curIdx);
        live.current.curIdx = n;
        setCurIdx(n);
      });
    }
  }, [curIdx, playlist]);

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return;
      const audio = audioRef.current;
      if (!audio) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          audio.paused ? audio.play() : audio.pause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.currentTime = Math.max(audio.currentTime - 5, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          audio.volume = Math.min(audio.volume + 0.05, 1);
          setVolume(audio.volume);
          break;
        case 'ArrowDown':
          e.preventDefault();
          audio.volume = Math.max(audio.volume - 0.05, 0);
          setVolume(audio.volume);
          break;
        case 'n':
        case 'l': {
          const n = pickNext(live.current.curIdx);
          live.current.curIdx = n;
          setCurIdx(n);
          break;
        }
        case 'p':
        case 'j': {
          const p = (live.current.curIdx - 1 + live.current.playlist.length) % live.current.playlist.length;
          live.current.curIdx = p;
          setCurIdx(p);
          break;
        }
        case 'm':
          audio.muted = !audio.muted;
          setVolume(audio.muted ? 0 : audio.volume);
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    a.paused ? a.play() : a.pause();
  }

  function seek(t: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }

  function changeVolume(v: number) {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function next() {
    const n = pickNext(curIdx);
    live.current.curIdx = n;
    setCurIdx(n);
  }

  function prev() {
    // Spotify-style: restart if past 3 s, otherwise go to previous track
    if (currentTime > 3) { seek(0); return; }
    const p = (curIdx - 1 + playlist.length) % playlist.length;
    live.current.curIdx = p;
    setCurIdx(p);
  }

  function jumpTo(i: number) {
    wantsPlayRef.current = true; // auto-play when track loads
    live.current.curIdx  = i;
    setCurIdx(i);
  }

  const MODES: ShuffleMode[] = ['likes', 'random', 'sequential'];

  return {
    audioRef, curIdx, isPlaying, currentTime, duration, volume, shuffleMode,
    togglePlay, next, prev, jumpTo, seek, changeVolume,
    cycleShuffleMode: () => setShuffleMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]),
  };
}
