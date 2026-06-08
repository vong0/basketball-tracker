import PlaylistRow from './PlaylistRow';
import styles from './Playlist.module.css';

export default function Playlist({
  cutSegments,
  parsedSegments,
  activeIdx,
  setActiveIdx,
  isMobile,
  onHelp
}) {
  return (
    <aside className={`${styles.playlist} ${isMobile ? styles.playlistMobile : ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>
          PLAYLIST <span className={styles.count}>({cutSegments.length})</span>
        </div>
        <button className={styles.helpBtn} onClick={onHelp} aria-label="Help">?</button>
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
