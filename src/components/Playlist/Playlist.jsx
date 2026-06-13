import { useState, useRef } from 'react';
import PlaylistRow from './PlaylistRow';
import FilterPopover from './FilterPopover';
import { isFilterActive } from '../../lib/deriveFilterOptions';
import styles from './Playlist.module.css';

export default function Playlist({
  title,
  cutSegments,
  parsedSegments,
  activeIdx,
  setActiveIdx,
  visibleIndices,
  filterChoice,
  setFilterChoice,
  filterOptions,
  isMobile,
  onHelp,
  onFilterOpen,
  onFilterClose,
  videoCollapsed,
  onToggleVideoCollapsed,
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  const openFilter = () => {
    if (onFilterOpen) onFilterOpen();
    setFilterOpen(true);
  };
  const closeFilter = () => {
    setFilterOpen(false);
    if (onFilterClose) onFilterClose();
  };
  const filterBtnRef = useRef(null);
  const filterActive = isFilterActive(filterChoice);
  const total = cutSegments.length;
  const visible = visibleIndices ? visibleIndices.length : total;
  const visibleSet = visibleIndices || cutSegments.map((_, i) => i);
  const countText = filterActive ? `(${visible} of ${total})` : `(${total})`;

  return (
    <aside className={`${styles.playlist} ${isMobile ? styles.playlistMobile : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
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
          <div className={styles.title}>
            {title || 'PLAYLIST'} <span className={styles.count}>{countText}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {filterOptions && (
            <button
              ref={filterBtnRef}
              className={filterActive ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
              onClick={() => filterOpen ? closeFilter() : openFilter()}
              aria-label="Filter clips"
              title="Filter clips"
            >
              ⚲
              {filterActive && <span className={styles.filterDot} />}
            </button>
          )}
          {filterOptions && (
            <FilterPopover
              opened={filterOpen}
              onClose={closeFilter}
              choice={filterChoice}
              setChoice={setFilterChoice}
              options={filterOptions}
              visible={visible}
              total={total}
            />
          )}
          <button className={styles.helpBtn} onClick={onHelp} aria-label="Help">?</button>
        </div>
      </div>
      <div className={styles.scroll}>
        {visibleSet.length === 0 ? (
          <div className={styles.emptyState}>No clips match the filter.</div>
        ) : (
          visibleSet.map(i => (
            <PlaylistRow
              key={i}
              segment={cutSegments[i]}
              parsed={parsedSegments[i]}
              index={i}
              isActive={i === activeIdx}
              onClick={() => setActiveIdx(i)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
