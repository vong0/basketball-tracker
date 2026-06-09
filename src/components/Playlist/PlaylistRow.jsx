import { useEffect, useRef } from 'react';
import { formatTime } from '../../lib/time';
import styles from './Playlist.module.css';

// Number of actions shown on inactive rows when there's no summary.
const INACTIVE_VISIBLE_ACTIONS = 2;

/**

 * Format a single action's body text:
 *   players + note  ->  "matt: drives baseline"
 *   players only    ->  "matt"
 *   note only       ->  "drives baseline"
 *   neither         ->  ""
 */
function actionLineText(action) {
  const players = action.players && action.players.length
    ? action.players.join(', ')
    : '';
  const note = action.note || '';
  if (players && note) return players + ': ' + note;
  if (players) return players;
  return note;
}

/**

 * Pick the dot CSS class for an action.
 *   Opponent (T) -> blue, regardless of G/B.
 *   Us (U) -> green/red/gray by quality.
 */
function dotClassFor(action, styles) {
  if (!action) return styles.dotNeutral;
  if (action.team === 'T') return styles.dotOpponent;
  if (action.quality === 'G') return styles.dotGood;
  if (action.quality === 'B') return styles.dotBad;
  return styles.dotNeutral;
}

/**

 * Scheme-only action with no quality letter — render without a dot.
 */
function isSchemeOnlyNoQuality(action) {
  if (!action) return false;
  const isScheme = action.type === 'MAN' || action.type === '2-3' || action.type === '3-2';
  return isScheme && !action.quality;
}

export default function PlaylistRow({ segment, parsed, index, isActive, onClick }) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (isActive && rowRef.current) {
      const el = rowRef.current;
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [isActive]);

  const actions = parsed?.actions || [];
  const summary = parsed?.summary || '';

  // ---------- ACTIVE ROW ----------
  // Always full disclosure: every action on its own line, no clamp.
  // If a summary exists, show it as a leading line above the actions.
  if (isActive) {
    return (
      <button
        ref={rowRef}
        onClick={onClick}
        className={`${styles.row} ${styles.rowActive}`}
      >
        <span className={styles.rowTime}>{formatTime(segment.start)}</span>
        <div className={styles.rowBody}>
          {summary && (
            <div className={`${styles.actionLine} ${styles.summaryLine}`}>
              {summary}
            </div>
          )}
          {actions.map((a, i) => {
            const text = actionLineText(a);
            const noDot = isSchemeOnlyNoQuality(a);
            return (
              <div key={i} className={styles.actionLine}>
                {!noDot && (
                  <span className={`${styles.dot} ${dotClassFor(a, styles)}`} />
                )}
                <span className={styles.actionText}>{text || segment.name}</span>
              </div>
            );
          })}
          {actions.length === 0 && (
            <div className={styles.actionLine}>
              <span className={styles.actionText}>{segment.name}</span>
            </div>
          )}
        </div>
      </button>
    );
  }

  // ---------- INACTIVE ROW ----------
  // If summary: show summary as the title (no dot, no player chip).
  if (summary) {
    return (
      <button
        ref={rowRef}
        onClick={onClick}
        className={styles.row}
      >
        <span className={styles.rowTime}>{formatTime(segment.start)}</span>
        <div className={styles.rowBody}>
          <div className={`${styles.actionLine} ${styles.summaryLine} ${styles.lineClamp}`}>
            {summary}
          </div>
        </div>
      </button>
    );
  }

  // No summary: show first N actions, with `· +M` if more exist.
  const visible = actions.slice(0, INACTIVE_VISIBLE_ACTIONS);
  const hidden = Math.max(0, actions.length - visible.length);

  return (
    <button
      ref={rowRef}
      onClick={onClick}
      className={styles.row}
    >
      <span className={styles.rowTime}>{formatTime(segment.start)}</span>
      <div className={styles.rowBody}>
        {visible.length === 0 ? (
          <div className={`${styles.actionLine} ${styles.lineClamp}`}>
            <span className={styles.actionText}>{segment.name}</span>
          </div>
        ) : (
          visible.map((a, i) => {
            const text = actionLineText(a);
            const noDot = isSchemeOnlyNoQuality(a);
            const isLast = i === visible.length - 1;
            return (
              <div
                key={i}
                className={`${styles.actionLine} ${styles.lineClamp}`}
              >
                {!noDot && (
                  <span className={`${styles.dot} ${dotClassFor(a, styles)}`} />
                )}
                <span className={styles.actionText}>{text || segment.name}</span>
                {isLast && hidden > 0 && (
                  <span className={styles.moreCount}>{' · +' + hidden}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </button>
  );
}
