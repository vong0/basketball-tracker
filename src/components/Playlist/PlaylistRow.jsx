import { useRef } from 'react';
import { formatTime } from '../../lib/time';
import { usePlaylistScroll } from './hooks/usePlaylistScroll';
import { dotKey, actionDisplayParts } from '../../lib/parseLabel';
import styles from './Playlist.module.css';

const DOT_CLASSES = {
  good:     styles.dotGood,
  bad:      styles.dotBad,
  opponent: styles.dotOpponent,
  neutral:  styles.dotNeutral,
};

function ActionText({ action, fallback }) {
  const { subject, note } = actionDisplayParts(action);
  if (note) return <><b>{subject}</b>{': '}{note}</>;
  return <b>{subject || fallback}</b>;
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
          const noDot = false;
          return (
            <div key={i} className={styles.actionLine}>
              {!noDot && (
                <span className={`${styles.dot} ${DOT_CLASSES[dotKey(a)]}`} />
              )}
              <ActionText action={a} fallback={segment.name} />
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
