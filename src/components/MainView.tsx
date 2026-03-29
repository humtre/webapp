import type { Track } from '@/types';
import { gradient } from '@/constants/colors';
import styles from '@/styles/MainView.module.css';

interface Props {
  track:       Track;
  trackIndex:  number;
  isPlaying:   boolean;
}

export default function MainView({ track, trackIndex, isPlaying }: Props) {
  const grad = gradient(trackIndex);

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
        </div>
      </div>
    </main>
  );
}
