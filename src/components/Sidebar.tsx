import { useRef, useEffect, useMemo } from 'react';
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

const Heart = () => <svg viewBox="0 0 16 16" fill="currentColor" width={12} height={12}><path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>;

interface Props {
  playlist: Track[];
  curIdx:   number;
  isOpen:   boolean;
  getLikes: (id: string) => number;
  onSelect: (i: number) => void;
  onClose:  () => void;
}

export default function Sidebar({ playlist, curIdx, isOpen, getLikes, onSelect }: Props) {
  const activeRef = useRef<HTMLLIElement>(null);

  // Sort by likes descending, stable by original order
  const sorted = useMemo(() => {
    const indexed = playlist.map((track, i) => ({ track, origIdx: i }));
    return indexed.sort((a, b) => getLikes(b.track.id) - getLikes(a.track.id));
  }, [playlist, getLikes]);

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
        {sorted.map(({ track, origIdx }) => (
          <li
            key={track.id}
            ref={origIdx === curIdx ? activeRef : null}
            role="option"
            aria-selected={origIdx === curIdx}
            className={`${styles.item} ${origIdx === curIdx ? styles.active : ''}`}
            onClick={() => onSelect(origIdx)}
          >
            <Avatar id={track.id} index={origIdx} />
            <span className={styles.name}>{track.id}</span>
            {getLikes(track.id) > 0 && <span className={styles.heart} aria-hidden><Heart />{getLikes(track.id)}</span>}
            {origIdx === curIdx && <span className={styles.dot} aria-hidden />}
          </li>
        ))}
      </ul>
    </aside>
  );
}
