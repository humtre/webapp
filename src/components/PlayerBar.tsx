import { useRef } from 'react';
import type { Track } from '@/types';
import styles from '@/styles/PlayerBar.module.css';

/* ── Inline SVG icons ── */
const Prev  = () => <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v11.575a.7.7 0 0 1-1.05.607L4 8.149V13.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"/></svg>;
const Next  = () => <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v11.575a.7.7 0 0 0 1.05.607L12 8.149V13.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"/></svg>;
const Play  = () => <svg viewBox="0 0 16 16" fill="currentColor" width={20} height={20}><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.712z"/></svg>;
const Pause = () => <svg viewBox="0 0 16 16" fill="currentColor" width={20} height={20}><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/></svg>;

const Shuffle = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}>
    <path d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z"/>
    <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192zm0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192z"/>
  </svg>
);

const VolHigh = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}>
    <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
    <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
    <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z"/>
    <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
  </svg>
);
const VolMid = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}>
    <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
    <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707z"/>
    <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
  </svg>
);
const VolLow = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}>
    <path d="M9 4a.5.5 0 0 0-.812-.39L5.825 5.5H3.5A.5.5 0 0 0 3 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 9 12V4zm3.025 4a4.486 4.486 0 0 1-1.318 3.182L10 10.475A3.489 3.489 0 0 0 11.025 8 3.49 3.49 0 0 0 10 5.525l.707-.707A4.486 4.486 0 0 1 12.025 8z"/>
  </svg>
);
const VolMute = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}>
    <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/>
  </svg>
);

const GRADIENTS = [
  'linear-gradient(135deg,#052e12,#1db954)', 'linear-gradient(135deg,#3a0520,#e91e8c)',
  'linear-gradient(135deg,#1a0a40,#7c4dff)', 'linear-gradient(135deg,#3a1800,#ff6d00)',
  'linear-gradient(135deg,#002e35,#00bcd4)', 'linear-gradient(135deg,#3a0a08,#f44336)',
  'linear-gradient(135deg,#1e3008,#8bc34a)', 'linear-gradient(135deg,#3a1408,#ff5722)',
];

interface Props {
  track:           Track;
  trackIndex:      number;
  isPlaying:       boolean;
  currentTime:     number;
  duration:        number;
  volume:          number;
  shuffle:         boolean;
  onTogglePlay:    () => void;
  onNext:          () => void;
  onPrev:          () => void;
  onSeek:          (t: number) => void;
  onVolumeChange:  (v: number) => void;
  onToggleShuffle: () => void;
  onMenuToggle:    () => void;
}

export default function PlayerBar({
  track, trackIndex, isPlaying, currentTime, duration, volume, shuffle,
  onTogglePlay, onNext, onPrev, onSeek, onVolumeChange, onToggleShuffle, onMenuToggle,
}: Props) {
  const prevVolRef = useRef(0.7);
  const pct        = duration > 0 ? (currentTime / duration) * 100 : 0;
  const grad       = GRADIENTS[trackIndex % GRADIENTS.length];

  const VolumeIcon = volume === 0 ? VolMute : volume < 0.34 ? VolLow : volume < 0.67 ? VolMid : VolHigh;

  function handleSeekBar(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - r.left) / r.width) * duration);
  }

  return (
    <footer className={styles.bar}>
      {/* Seek bar as the top boundary line */}
      <div className={styles.seekBar} onClick={handleSeekBar}>
        <div className={styles.seekFill} style={{ width: `${pct}%` }} />
      </div>

      {/* ── Left: thumb + track name ── */}
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle playlist">
          <svg viewBox="0 0 16 16" fill="currentColor" width={18} height={18}>
            <path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
        <div className={styles.thumb} style={{ background: grad }} />
        <span className={styles.name}>{track.id}</span>
      </div>

      {/* ── Controls: shuffle / prev / play / next ── */}
      <div className={styles.controls}>
        <button
          className={`${styles.btn} ${styles.shuffleBtn} ${shuffle ? styles.on : ''}`}
          onClick={onToggleShuffle} aria-label="Shuffle"
        >
          <Shuffle />
        </button>
        <button className={styles.btn} onClick={onPrev} aria-label="Previous"><Prev /></button>
        <button className={styles.play} onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause /> : <Play />}
        </button>
        <button className={styles.btn} onClick={onNext} aria-label="Next"><Next /></button>
      </div>

      {/* ── Right: volume ── */}
      <div className={styles.right}>
        <button
          className={styles.btn}
          onClick={() => {
            if (volume > 0) { prevVolRef.current = volume; onVolumeChange(0); }
            else onVolumeChange(prevVolRef.current);
          }}
          aria-label="Toggle mute"
        >
          <VolumeIcon />
        </button>
        <input
          className={styles.vol}
          type="range" min={0} max={1} step={0.005}
          value={volume}
          style={{ '--p': `${volume * 100}%` } as React.CSSProperties}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label="Volume"
        />
      </div>


    </footer>
  );
}
