import styles from './VideoPlayer.module.css';

export default function Seekbar({ seekbarRef, progress, isDragging, onPointerDown }) {
  return (
    <div
      ref={seekbarRef}
      className={`${styles.seekbarTrack} ${isDragging ? styles.dragging : ''}`}
      onPointerDown={onPointerDown}
    >
      <div className={styles.seekbarFill} style={{ width: (progress * 100) + '%' }} />
      <div className={styles.seekbarThumb} style={{ left: (progress * 100) + '%' }} />
    </div>
  );
}
