import { useRef, useEffect, useMemo, useState } from 'react';
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
const SearchIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width={14} height={14}><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>;
const SortHeart = () => <svg viewBox="0 0 16 16" fill="currentColor" width={12} height={12}><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>;
const SortAZ = () => <svg viewBox="0 0 16 16" fill="currentColor" width={12} height={12}><path d="M2.5 12.5A.5.5 0 0 1 3 12h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 3 8h7a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 3 4h4a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>;
const ArrowUp = () => <svg viewBox="0 0 10 10" fill="currentColor" width={8} height={8}><path d="M5 1L1 6h8z"/></svg>;
const ArrowDown = () => <svg viewBox="0 0 10 10" fill="currentColor" width={8} height={8}><path d="M5 9L1 4h8z"/></svg>;

type SortField = 'likes' | 'alpha';
type SortDir = 'asc' | 'desc';

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
  const SORT_CYCLE: [SortField, SortDir][] = [['likes','desc'],['likes','asc'],['alpha','asc'],['alpha','desc']];
  const [sortIdx, setSortIdx] = useState(0);
  const [sortField, sortDir] = SORT_CYCLE[sortIdx];
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    const indexed = playlist.map((track, i) => ({ track, origIdx: i }));
    const filtered = query
      ? indexed.filter(({ track }) => track.id.toLowerCase().includes(query.toLowerCase()))
      : indexed;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortField === 'likes') {
      return filtered.sort((a, b) => dir * (getLikes(a.track.id) - getLikes(b.track.id)));
    }
    return filtered.sort((a, b) => dir * a.track.id.localeCompare(b.track.id));
  }, [playlist, getLikes, sortField, sortDir, query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [curIdx]);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <span className={styles.logo}>humtre</span>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={`${styles.sortBtn} ${styles.sortActive}`}
            onClick={() => setSortIdx((i) => (i + 1) % SORT_CYCLE.length)}
            aria-label={`Sort: ${sortField} ${sortDir}`}
          >
            {sortField === 'likes' ? <SortHeart /> : <SortAZ />}
            {sortDir === 'desc' ? <ArrowDown /> : <ArrowUp />}
          </button>
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
