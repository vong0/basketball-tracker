import { Checkbox } from '@mantine/core';
import PlaylistRow from './PlaylistRow';
import styles from './Playlist.module.css';

export default function Playlist({
  segments,
  parsedSegments,
  activeIdx,
  setActiveIdx,
  loopSegment,
  setLoopSegment,
  isMobile,
  onHelp
}) {
  return (
    <aside className={`${styles.playlist} ${isMobile ? styles.playlistMobile : ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>
          PLAYLIST <span className={styles.count}>({segments.length})</span>
        </div>
        <button className={styles.helpBtn} onClick={onHelp} aria-label="Help">?</button>
      </div>

      <div className={styles.toggleRow}>
        <Checkbox
          label="loop segment"
          checked={loopSegment}
          onChange={(e) => setLoopSegment(e.currentTarget.checked)}
          size="xs"
          color="orange"
        />
      </div>

      <div className={styles.scroll}>
        {segments.map((seg, i) => (
          <PlaylistRow
            key={seg.id || i}
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
