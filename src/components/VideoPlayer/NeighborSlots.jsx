import styles from './VideoPlayer.module.css';

export default function NeighborSlots({ activeIdx, cutSegmentsLength, children }) {
  return (
    <>
      <div className={`${styles.neighborSlot} ${styles.neighborPrev}`} aria-hidden="true">
        <div className={styles.neighborInner}>
          {activeIdx > 0 && <div className={styles.neighborLabel}>← Prev Clip</div>}
        </div>
      </div>
      {children}
      <div className={`${styles.neighborSlot} ${styles.neighborNext}`} aria-hidden="true">
        <div className={styles.neighborInner}>
          {activeIdx < cutSegmentsLength - 1 && <div className={styles.neighborLabel}>Next clip →</div>}
        </div>
      </div>
    </>
  );
}
