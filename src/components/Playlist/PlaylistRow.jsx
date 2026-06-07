import { useEffect, useRef } from 'react';
import { formatTime } from '../../lib/time';
import styles from './Playlist.module.css';

export default function PlaylistRow({ segment, parsed, index, isActive, onClick }) {
  const rowRef = useRef(null);
  const duration = segment.end - segment.start;

  useEffect(() => {
    if (isActive && rowRef.current) {
      const el = rowRef.current;
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [isActive]);

  const dotClass =
    parsed.quality === 'good'
      ? styles.dotGood
      : parsed.quality === 'bad'
      ? styles.dotBad
      : styles.dotNeutral;

  return (
    <button
      ref={rowRef}
      onClick={onClick}
      className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
    >
      <span className={styles.rowIndex}>{index + 1}</span>
      <span className={`${styles.dot} ${dotClass}`} />
      <div className={styles.rowBody}>
        <div className={styles.rowLabel}>{parsed.title}</div>
        <div className={styles.rowTime}>
          {formatTime(segment.start)} / {formatTime(duration)}
        </div>
      </div>
    </button>
  );
}
