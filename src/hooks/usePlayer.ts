import { useRef, useState, useEffect } from 'react';
import type { Track } from '@/types';
import { SEARCH_SERVICE } from '@/App';

// Audio stream URL — the server proxies bytes from GCS so no signed key needed
function streamUrl(blobName: string): string {
  return `${SEARCH_SERVICE}/api/stream?blob_name=${encodeURIComponent(blobName)}`;
}

interface PlayerState {
  audioRef:       React.RefObject<HTMLAudioElement | null>;
  curIdx:         number;
  isPlaying:      boolean;
  currentTime:    number;
  duration:       number;
  volume:         number;
  shuffle:        boolean;
  togglePlay:     () => void;
  next:           () => void;
  prev:           () => void;
  jumpTo:         (i: number) => void;
  seek:           (t: number) => void;
  changeVolume:   (v: number) => void;
  toggleShuffle:  () => void;
}

export function usePlayer(playlist: Track[]): PlayerState {
  const audioRef     = useRef<HTMLAudioElement>(null);
  const wantsPlayRef = useRef(false); // jumpTo() sets this so the track auto-plays on select

  const [curIdx,      setCurIdx]      = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(0.7);
  const [shuffle,     setShuffle]     = useState(false);

  // Mutable ref so audio event callbacks always see current values without stale closures
  const live = useRef({ curIdx: 0, shuffle: false, playlist: [] as Track[] });
  useEffect(() => { live.current.curIdx   = curIdx;   }, [curIdx]);
  useEffect(() => { live.current.shuffle  = shuffle;  }, [shuffle]);
  useEffect(() => { live.current.playlist = playlist; }, [playlist]);

  function pickNext(from: number): number {
    const list = live.current.playlist;
    if (!list.length) return 0;
    if (!live.current.shuffle) return (from + 1) % list.length;
    // Shuffle: random index, avoid repeating the same track
    let n = Math.floor(Math.random() * list.length);
    if (list.length > 1 && n === from) n = (from + 1) % list.length;
    return n;
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

  return {
    audioRef, curIdx, isPlaying, currentTime, duration, volume, shuffle,
    togglePlay, next, prev, jumpTo, seek, changeVolume,
    toggleShuffle: () => setShuffle((s) => !s),
  };
}
