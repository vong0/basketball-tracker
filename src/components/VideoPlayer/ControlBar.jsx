import { formatTime } from '../../lib/time';
import Seekbar from './Seekbar';
import styles from './VideoPlayer.module.css';

export default function ControlBar({
  isPlaying,
  onTogglePlay,
  currentTime,
  activeSegment,
  segDuration,
  segProgress,
  isDragging,
  seekbarRef,
  onSeekbarPointerDown,
  onToggleFullscreen,
  isFullscreen,
  visible
}) {
  return (
    <div
      className={`${styles.controlBar} ${visible ? '' : styles.faded}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className={styles.controlButton}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <span className={styles.timeDisplay}>
        {formatTime(currentTime - activeSegment.start)} / {formatTime(segDuration)}
      </span>

      <Seekbar
        seekbarRef={seekbarRef}
        progress={segProgress}
        isDragging={isDragging}
        onPointerDown={onSeekbarPointerDown}
      />

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
        className={styles.controlButton}
      >
        ⛶
      </button>
    </div>
  );
}
