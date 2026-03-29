import { useRef, useCallback } from 'react';
import type { Track } from '@/types';
import { gradient } from '@/constants/colors';
import styles from '@/styles/MainView.module.css';

const HeartFill  = () => <svg viewBox="0 0 16 16" fill="currentColor" width={20} height={20}><path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>;
const HeartEmpty = () => <svg viewBox="0 0 16 16" fill="currentColor" width={20} height={20}><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>;

interface Props {
  track:       Track;
  trackIndex:  number;
  isPlaying:   boolean;
  likes:       number;
  onLike:      () => void;
  onUnlike:    () => void;
}

/** Click = +1, long press (500ms) = -1 */
function useLikePress(onLike: () => void, onUnlike: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fired = useRef(false);

  const onDown = useCallback(() => {
    fired.current = false;
    timer.current = setTimeout(() => { fired.current = true; onUnlike(); }, 500);
  }, [onUnlike]);

  const onUp = useCallback(() => {
    clearTimeout(timer.current);
    if (!fired.current) onLike();
  }, [onLike]);

  const onLeave = useCallback(() => {
    clearTimeout(timer.current);
  }, []);

  return { onPointerDown: onDown, onPointerUp: onUp, onPointerLeave: onLeave };
}

export default function MainView({ track, trackIndex, isPlaying, likes, onLike, onUnlike }: Props) {
  const grad = gradient(trackIndex);
  const press = useLikePress(onLike, onUnlike);

  return (
    <main className={styles.main}>
      <div className={styles.ambient} style={{ background: grad }} />

      <div className={styles.content}>
        <div className={styles.art} style={{ background: grad }}>
          {isPlaying && (
            <div className={styles.eq} aria-hidden>
              <span /><span /><span /><span />
            </div>
          )}
        </div>

        <div className={styles.info}>
          <p className={styles.label}>Now Playing</p>
          <h1 className={styles.title}>{track.id}</h1>
          <button
            className={`${styles.likeBtn} ${likes > 0 ? styles.liked : ''}`}
            aria-label={`Like (${likes})`}
            {...press}
          >
            {likes > 0 ? <HeartFill /> : <HeartEmpty />}
            {likes > 0 && <span className={styles.likeCount}>{likes}</span>}
          </button>
        </div>
      </div>
    </main>
  );
}
