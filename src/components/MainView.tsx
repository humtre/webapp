import type { Track } from '@/types';
import styles from '@/styles/MainView.module.css';

const GRADIENTS = [
  'linear-gradient(135deg,#052e12,#1db954)',
  'linear-gradient(135deg,#3a0520,#e91e8c)',
  'linear-gradient(135deg,#1a0a40,#7c4dff)',
  'linear-gradient(135deg,#3a1800,#ff6d00)',
  'linear-gradient(135deg,#002e35,#00bcd4)',
  'linear-gradient(135deg,#3a0a08,#f44336)',
  'linear-gradient(135deg,#1e3008,#8bc34a)',
  'linear-gradient(135deg,#3a1408,#ff5722)',
];

interface Props {
  track:       Track;
  trackIndex:  number;
  isPlaying:   boolean;
}

export default function MainView({ track, trackIndex, isPlaying }: Props) {
  const gradient = GRADIENTS[trackIndex % GRADIENTS.length];

  return (
    <main className={styles.main}>
      <div className={styles.ambient} style={{ background: gradient }} />

      <div className={styles.content}>
        <div className={styles.art} style={{ background: gradient }}>
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
