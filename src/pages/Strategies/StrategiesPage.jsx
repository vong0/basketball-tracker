import { useState, useEffect, useMemo } from 'react';
import Banner from '../../components/Banner/Banner';
import styles from './StrategiesPage.module.css';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import { getYouTubeId } from '../../lib/youtube';
import { parseLabel } from '../../lib/parseLabel';
import { getStrategies } from '../../lib/backend.js';

function groupByDefenseType(strategies) {
  const out = {};
  for (const s of strategies) {
    if (!out[s.defenseType]) out[s.defenseType] = [];
    out[s.defenseType].push(s);
  }
  return out;
}

// ── Clip card ─────────────────────────────────────────────────────────────────

function ClipCard({ clip, isActive, onPlay }) {
  return (
    <button
      className={`${styles.clipCard} ${isActive ? styles.clipCardActive : ''}`}
      onClick={() => onPlay(clip)}
    >
      <span className={styles.clipPlay}>{isActive ? '■' : '▶'}</span>
      <span className={styles.clipLabel}>{clip.label}</span>
    </button>
  );
}

// ── Description block ─────────────────────────────────────────────────────────

function DescriptionBlock({ lines }) {
  const items = Array.isArray(lines) ? lines : [lines];

  const blocks = [];
  let bulletBuffer = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      blocks.push({ type: 'bullets', items: [...bulletBuffer] });
      bulletBuffer = [];
    }
  };

  for (const line of items) {
    if (!line || line.trim() === '') {
      flushBullets();
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('-')) {
      bulletBuffer.push(trimmed.slice(1).trim());
    } else {
      flushBullets();
      blocks.push({ type: 'line', text: line });
    }
  }
  flushBullets();

  return (
    <div className={styles.descBlock}>
      {blocks.map((block, i) => {
        if (block.type === 'bullets') {
          return (
            <ul key={i} className={styles.descBulletList}>
              {block.items.map((item, j) => (
                <li key={j} className={styles.descBulletItem}>{item}</li>
              ))}
            </ul>
          );
        }
        const line = block.text;
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 28) {
          const label = line.slice(0, colonIdx);
          const rest = line.slice(colonIdx + 1).trim();
          return (
            <p key={i} className={styles.descLine}>
              <span className={styles.descLabel}>{label}:</span>{' '}{rest}
            </p>
          );
        }
        return <p key={i} className={styles.descLine}>{line}</p>;
      })}
    </div>
  );
}

// ── Strategy card ─────────────────────────────────────────────────────────────

function StrategyCard({ strategy, isMobile }) {
  const [open, setOpen] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const s = strategy;

  const activeVideoId = activeClip ? getYouTubeId(activeClip.youtubeUrl) : null;
  const cutSegments = activeClip
    ? [{ start: activeClip.start, end: activeClip.end, name: activeClip.label }]
    : [];
  const parsedSegments = cutSegments.map(seg => parseLabel(seg.name || ''));

  const handlePlay = (clip) => {
    const isSame = activeClip
      && activeClip.youtubeUrl === clip.youtubeUrl
      && activeClip.start === clip.start;
    setActiveClip(isSame ? null : clip);
  };

  return (
    <div id={'play-' + s.id} className={styles.card}>
      <button
        className={styles.cardHeader}
        onClick={() => {
          if (open && activeClip) setActiveClip(null);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
      >
        <div className={styles.cardHeaderLeft}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardName}>{s.name}</h3>
          </div>
          {s.summary && (
            <p className={styles.cardSummary}>{s.summary}</p>
          )}
        </div>
        <div className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className={styles.cardBody}>
          <div className={styles.cardDivider} />
          <DescriptionBlock lines={s.description} />

          {s.clips.length > 0 && (
            <div className={styles.clipsSection}>
              <div className={styles.clipsSectionLabel}>Film Clips</div>
              <div className={styles.clipsList}>
                {s.clips.map((clip, i) => (
                  <ClipCard
                    key={i}
                    clip={clip}
                    isActive={
                      !!activeClip &&
                      activeClip.youtubeUrl === clip.youtubeUrl &&
                      activeClip.start === clip.start
                    }
                    onPlay={handlePlay}
                  />
                ))}
              </div>

              {activeClip && activeVideoId && (
                <div className={styles.clipPlayer}>
                  <div className={styles.clipPlayerInner}>
                    <VideoPlayer
                      videoId={activeVideoId}
                      cutSegments={cutSegments}
                      parsedSegments={parsedSegments}
                      activeIdx={0}
                      setActiveIdx={() => {}}
                      visibleIndices={[0]}
                      isFullscreen={isFullscreen}
                      setIsFullscreen={setIsFullscreen}
                      isMobile={isMobile}
                      hideCounter
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {s.clips.length === 0 && (
            <p className={styles.noClips}>No film clips added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mobile TOC ────────────────────────────────────────────────────────────────

function MobileTOC({ groups }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.mobileToc}>
      <button
        className={styles.mobileTocToggle}
        onClick={() => setOpen((o) => !o)}
      >
        <span>☰  Jump to Play</span>
        <span
          className={styles.mobileTocChevron}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >▼</span>
      </button>
      {open && (
        <div className={styles.mobileTocMenu}>
          {Object.entries(groups).map(([defType, strats]) => (
            <div key={defType}>
              <div className={styles.mobileTocGroup}>{defType}</div>
              {strats.map((s) => (
                <button
                  key={s.id}
                  className={styles.mobileTocItem}
                  onClick={() => {
                    setOpen(false);
                    const el = document.getElementById('play-' + s.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Desktop TOC ───────────────────────────────────────────────────────────────

function DesktopTOC({ groups }) {
  return (
    <div className={styles.desktopToc}>
      <div className={styles.desktopTocInner}>
        <div className={styles.desktopTocHeading}>Plays</div>
        {Object.entries(groups).map(([defType, strats]) => (
          <div key={defType}>
            <div className={styles.desktopTocGroup}>{defType}</div>
            {strats.map((s) => (
              <button
                key={s.id}
                className={styles.desktopTocItem}
                onClick={() => {
                  const el = document.getElementById('play-' + s.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const FILTER_ALL = 'all';

function FilterBar({ filters, active, onChange }) {
  return (
    <div className={styles.filterBar}>
      {filters.map((f) => (
        <button
          key={f.id}
          className={`${styles.filterBtn} ${active === f.id ? styles.filterBtnActive : ''}`}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StrategiesPage({ isMobile }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const strategies = await getStrategies();
        if (!cancelled) setData(strategies);
      } catch (err) {
        if (!cancelled) {
          console.error('Could not load strategies:', err);
          setError(String(err));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const strategies = Array.isArray(data) ? data : [];

  const filters = useMemo(() => {
    const seen = new Set();
    const out = [{ id: FILTER_ALL, label: 'All' }];
    for (const s of strategies) {
      if (!seen.has(s.defenseType)) {
        seen.add(s.defenseType);
        out.push({ id: s.defenseType, label: s.defenseType });
      }
    }
    return out;
  }, [strategies]);

  const filtered = useMemo(
    () =>
      activeFilter === FILTER_ALL
        ? strategies
        : strategies.filter((s) => s.defenseType === activeFilter),
    [strategies, activeFilter]
  );

  const groups = useMemo(() => groupByDefenseType(filtered), [filtered]);

  return (
    <div className={styles.page}>
      <Banner isMobile={isMobile} />

      <div className={styles.heroBanner}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>PLAYBOOK</div>
          <div className={styles.heroRow}>
            <h1 className={styles.heading}>Strategies</h1>
            <span className={styles.heroCount}>
              <span className={styles.heroCountNum}>{filtered.length}</span>
              <span className={styles.heroCountLabel}>plays</span>
            </span>
          </div>
          <FilterBar
            filters={filters}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.inner}>
          {error && <p className={styles.stateMsg}>Could not load strategies. ({error})</p>}
          {!data && !error && <p className={styles.stateMsg}>Loading...</p>}

          {data && (
            <div className={styles.layout}>
              <DesktopTOC groups={groups} />
              <div className={styles.main}>
                <MobileTOC groups={groups} />

                {filtered.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🏀</div>
                    <p className={styles.emptyText}>No strategies in this category yet.</p>
                  </div>
                ) : (
                  Object.entries(groups).map(([defType, strats]) => (
                    <div key={defType} className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitleRow}>
                          <h2 className={styles.sectionTitle}>{defType}</h2>
                          <span className={styles.sectionCount}>
                            {strats.length} {strats.length === 1 ? 'play' : 'plays'}
                          </span>
                        </div>
                        <div className={styles.sectionRule} />
                      </div>
                      {strats.map((s) => (
                        <StrategyCard
                          key={s.id}
                          strategy={s}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
