import { useRef, useEffect } from 'react';
import type { Track } from '@/types';
import { gradient } from '@/constants/colors';
import styles from '@/styles/Sidebar.module.css';

function Avatar({ id, index }: { id: string; index: number }) {
  return (
    <div
      className={styles.avatar}
      style={{ background: gradient(index) }}
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

export default function Sidebar({ playlist, curIdx, isOpen, onSelect }: Props) {
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
