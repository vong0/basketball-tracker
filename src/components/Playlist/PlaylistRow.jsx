import { useRef } from 'react';
import { formatTime } from '../../lib/time';
import { usePlaylistScroll } from './hooks/usePlaylistScroll';
import { dotClassFor, isSchemeOnlyNoQuality } from './utils';
import styles from './Playlist.module.css';

function actionLineText(action) {
  const players = action.players && action.players.length
    ? action.players.join(', ')
    : '';
  const note = action.note || '';
  const isOpp = action.team === 'O';

  if (isOpp) {
    const head = players ? 'opp ' + players : 'opp';
    return note ? (<><b>{head}</b>: {note}</>) : (<b>{head}</b>);
  }
  if (players && note) return (<><b>{players}</b>: {note}</>);
  if (players) return (<b>{players}</b>);
  if (note) return (<><b>all</b>: {note}</>);
  return (<b>all</b>);
}

export default function PlaylistRow({ segment, parsed, isActive, onClick }) {
  const rowRef = useRef(null);
  usePlaylistScroll(isActive, rowRef);

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
