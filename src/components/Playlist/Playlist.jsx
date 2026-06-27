import PlaylistRow from './PlaylistRow';
import FilterPopover from './FilterPopover';
import { useFilterState } from './hooks/useFilterState';
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
  isMobile,
  onHelp,
  onFilterOpen,
  onFilterClose,
  videoCollapsed,
  onToggleVideoCollapsed,
  multiGame,  // show clip numbers + game badges instead of timestamps
}) {
  const { filterOpen, filterBtnRef, openFilter, closeFilter, filterActive, filterOptions, total, visible, visibleSet } =
    useFilterState({ cutSegments, parsedSegments, visibleIndices, filterChoice, onFilterOpen, onFilterClose });

  const activeCount = filterChoice
    ? (filterChoice.player ? 1 : 0) + (filterChoice.rating ? 1 : 0) + (filterChoice.possession ? 1 : 0)
    : 0;

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
              {videoCollapsed ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              )}
            </button>
          )}
          <div className={styles.title}>{title || 'PLAYLIST'}</div>
        </div>
        <div className={styles.headerActions}>
          <button
            ref={filterBtnRef}
            className={filterActive ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
            onClick={() => filterOpen ? closeFilter() : openFilter()}
            aria-label="Filter clips"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filters{activeCount > 0 ? ` · ${activeCount}` : ''}</span>
          </button>
          <FilterPopover
            opened={filterOpen}
            onClose={closeFilter}
            choice={filterChoice}
            setChoice={setFilterChoice}
            options={filterOptions}
            visible={visible}
            total={total}
          />
          {onHelp && <button className={styles.helpBtn} onClick={onHelp} aria-label="Help">?</button>}
        </div>
      </div>
      <div className={styles.scroll}>
        {visibleSet.length === 0 ? (
          <div className={styles.emptyState}>No clips match the filter.</div>
        ) : (
          visibleSet.map((i, pos) => (
            <PlaylistRow
              key={i}
              segment={cutSegments[i]}
              parsed={parsedSegments[i]}
              isActive={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              timeLabel={multiGame ? `#${pos + 1}` : undefined}
              gameLabel={multiGame ? cutSegments[i].gameLabel : undefined}
            />
          ))
        )}
      </div>
    </aside>
  );
}
