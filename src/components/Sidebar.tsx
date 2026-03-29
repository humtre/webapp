import { useRef, useEffect } from 'react';
import type { Track } from '@/types';
import styles from '@/styles/Sidebar.module.css';

const COLORS: [string, string][] = [
  ['#1db954','#052e12'], ['#e91e8c','#3a0520'], ['#7c4dff','#1a0a40'],
  ['#ff6d00','#3a1800'], ['#00bcd4','#002e35'], ['#f44336','#3a0a08'],
  ['#8bc34a','#1e3008'], ['#ff5722','#3a1408'],
];

function Avatar({ id, index }: { id: string; index: number }) {
  const [fg, bg] = COLORS[index % COLORS.length];
  return (
    <div
      className={styles.avatar}
      style={{ background: `linear-gradient(135deg,${bg},${fg})` }}
      aria-hidden
    >
      {id.slice(0, 2).toUpperCase()}
    </div>
  );
}

interface Props {
  playlist: Track[];
  curIdx:   number;
  isOpen:   boolean;
  onSelect: (i: number) => void;
  onClose:  () => void;
}

export default function Sidebar({ playlist, curIdx, isOpen, onSelect, onClose }: Props) {
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [curIdx]);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <span className={styles.logo}>humtre</span>
        <div className={styles.libraryRow}>
          <span className={styles.label}>Your Library</span>
          <span className={styles.count}>{playlist.length}</span>
        </div>
      </div>

      <ul className={styles.list} role="listbox" aria-label="Playlist">
        {playlist.map((track, i) => (
          <li
            key={track.id}
            ref={i === curIdx ? activeRef : null}
            role="option"
            aria-selected={i === curIdx}
            className={`${styles.item} ${i === curIdx ? styles.active : ''}`}
            onClick={() => onSelect(i)}
          >
            <Avatar id={track.id} index={i} />
            <span className={styles.name}>{track.id}</span>
            {i === curIdx && <span className={styles.dot} aria-hidden />}
          </li>
        ))}
      </ul>
    </aside>
  );
}
