import { useEffect, useRef } from 'react';
import { formatTime } from '../../lib/time';
import styles from './Playlist.module.css';

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
  const isOpp = action.team === 'O';

  // Returns JSX with <b> wrapping the player/team head so names
  // pop visually when scanning the playlist.
  if (isOpp) {
    const head = players ? 'opp ' + players : 'opp';
    return note ? (<><b>{head}</b>: {note}</>) : (<b>{head}</b>);
  }
  if (players && note) return (<><b>{players}</b>: {note}</>);
  if (players) return (<b>{players}</b>);
  if (note) return (<><b>all</b>: {note}</>);
  return (<b>all</b>);
}

/**

 * Pick the dot CSS class for an action.
 *   Opponent (T) -> blue, regardless of G/B.
 *   Us (U) -> green/red/gray by quality.
 */
function dotClassFor(action, styles) {
  if (!action) return styles.dotNeutral;
  if (action.team === 'O') return styles.dotOpponent;
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

/**

 * One render path for both active and inactive rows. Content is identical:
 * summary (if any) on one line, then every action on its own line with its
 * own dot. Long text wraps to multiple lines — never truncated, never "+N".
 *
 * The `isActive` flag only controls:
 *   1. The .rowActive class for visual styling (orange tint + left border).
 *   2. The auto-scroll-into-view effect when the row becomes active.
 */
export default function PlaylistRow({ segment, parsed, isActive, onClick }) {
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

  return (
    <button
      ref={rowRef}
      onClick={onClick}
      className={isActive ? (styles.row + ' ' + styles.rowActive) : styles.row}
    >
      <span className={styles.rowTime}>{formatTime(segment.start)}</span>
      <div className={styles.rowBody}>
        {summary && (
          <div className={styles.actionLine + ' ' + styles.summaryLine}>
            {summary}
          </div>
        )}
        {actions.map((a, i) => {
          const text = actionLineText(a);
          const noDot = isSchemeOnlyNoQuality(a);
          return (
            <div key={i} className={styles.actionLine}>
              {!noDot && (
                <span className={styles.dot + ' ' + dotClassFor(a, styles)} />
              )}
              <span className={styles.actionText}>{text || segment.name}</span>
            </div>
          );
        })}
        {actions.length === 0 && !summary && (
          <div className={styles.actionLine}>
            <span className={styles.actionText}>{segment.name}</span>
          </div>
        )}
      </div>
    </button>
  );
}
