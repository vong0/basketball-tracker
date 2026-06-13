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
      <button onClick={onTogglePlay} className={styles.controlButton} disabled={disabled} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6 4 20 12 6 20" />
          </svg>
        )}
      </button>
      <Seekbar
        seekbarRef={seekbarRef}
        progress={segProgress}
        isDragging={isDragging}
        onPointerDown={disabled ? undefined : onSeekbarPointerDown}
      />
      <button onClick={onToggleFullscreen} className={styles.controlButton} disabled={disabled} aria-label="Toggle fullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="4 9 4 4 9 4" />
          <polyline points="20 9 20 4 15 4" />
          <polyline points="4 15 4 20 9 20" />
          <polyline points="20 15 20 20 15 20" />
        </svg>
      </button>
    </div>
  );
}
