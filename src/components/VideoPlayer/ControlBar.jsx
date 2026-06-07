import Seekbar from './Seekbar';
import styles from './VideoPlayer.module.css';

export default function ControlBar({
  isPlaying,
  onTogglePlay,
  segProgress,
  isDragging,
  seekbarRef,
  onSeekbarPointerDown,
  onToggleFullscreen,
  disabled
}) {
  return (
    <div className={styles.controlBar}>
      <button onClick={onTogglePlay} className={styles.controlButton} disabled={disabled}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <Seekbar
        seekbarRef={seekbarRef}
        progress={segProgress}
        isDragging={isDragging}
        onPointerDown={disabled ? undefined : onSeekbarPointerDown}
      />
      <button onClick={onToggleFullscreen} className={styles.controlButton} disabled={disabled}>
        ⛶
      </button>
    </div>
  );
}
