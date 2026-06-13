import PlaylistRow from './PlaylistRow';
import styles from './Playlist.module.css';

export default function Playlist({
  title,
  cutSegments,
  parsedSegments,
  activeIdx,
  setActiveIdx,
  isMobile,
  onHelp,
  videoCollapsed,
  onToggleVideoCollapsed,
}) {
  return (
    <aside className={`${styles.playlist} ${isMobile ? styles.playlistMobile : ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>
          {title || 'PLAYLIST'} <span className={styles.count}>({cutSegments.length})</span>
        </div>
        <div className={styles.headerActions}>
          {isMobile && onToggleVideoCollapsed && (
            <button
              className={styles.collapseBtn}
              onClick={onToggleVideoCollapsed}
              aria-label={videoCollapsed ? 'Expand video' : 'Collapse video'}
              title={videoCollapsed ? 'Expand video' : 'Collapse video'}
            >
              {videoCollapsed ? '▼' : '▲'}
            </button>
          )}
          <button className={styles.helpBtn} onClick={onHelp} aria-label="Help">?</button>
        </div>
      </div>

      <div className={styles.scroll}>
        {cutSegments.map((seg, i) => (
          <PlaylistRow
            key={i}
            segment={seg}
            parsed={parsedSegments[i]}
            index={i}
            isActive={i === activeIdx}
            onClick={() => setActiveIdx(i)}
          />
        ))}
      </div>
    </aside>
  );
}
