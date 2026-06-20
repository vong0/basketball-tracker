import { Modal } from '@mantine/core';
import { parseLabel } from '../../lib/parseLabel';
import { formatTime } from '../../lib/time';
import styles from './VideoPlayer.module.css';

function dotClassFor(a) {
  if (a.team === 'O') return styles.dotOpponent;
  if (a.quality === 'G') return styles.dotGood;
  if (a.quality === 'B') return styles.dotBad;
  return styles.dotNeutral;
}

function isSchemeOnlyNoQuality(a) {
  const isScheme = a.type === 'MAN' || a.type === '2-3' || a.type === '3-2';
  return isScheme && !a.quality;
}

function actionLineText(a) {
  const players = a.players && a.players.length ? a.players.join(', ') : '';
  const note = a.note || '';
  const isOpp = a.team === 'O';
  if (isOpp) {
    const head = players ? 'opp ' + players : 'opp';
    return note ? head + ': ' + note : head;
  }
  if (players && note) return players + ': ' + note;
  if (players) return players;
  if (note) return 'all: ' + note;
  return 'all';
}

export default function ClipInfoModal({ opened, onClose, activeSegment, activeParsed, navList, activeIdx }) {
  const navPos = navList.indexOf(activeIdx);
  const display = navPos === -1 ? 1 : navPos + 1;
  const title = activeSegment ? `CLIP ${display} / ${navList.length}` : 'CLIP INFO';

  let body = null;
  if (activeSegment) {
    const parsed = activeParsed || parseLabel(activeSegment.name || '');
    const dur = activeSegment.end - activeSegment.start;
    const qLabel = parsed.quality === 'good' ? 'GOOD' : parsed.quality === 'bad' ? 'BAD' : 'NEUTRAL';
    const qClass = parsed.quality === 'good'
      ? styles.infoQualityGood
      : parsed.quality === 'bad'
      ? styles.infoQualityBad
      : styles.infoQualityNeutral;
    const actions = parsed.actions || [];
    const summary = parsed.summary || '';

    body = (
      <div>
        <div className={styles.infoMetaRow}>
          <span className={`${styles.infoQualityBadge} ${qClass}`}>{qLabel}</span>
          <span className={styles.infoTimeRange}>
            {formatTime(activeSegment.start)} → {formatTime(activeSegment.end)}
            <span className={styles.infoDuration}> · {formatTime(dur)}</span>
          </span>
        </div>
        <div className={styles.infoBody}>
          {actions.map((a, i) => {
            const text = actionLineText(a);
            const noDot = isSchemeOnlyNoQuality(a);
            return (
              <div key={i} className={styles.infoActionLine}>
                {!noDot && <span className={`${styles.infoLineDot} ${dotClassFor(a)}`} />}
                <span className={styles.infoActionText}>{text || activeSegment.name}</span>
              </div>
            );
          })}
          {actions.length === 0 && !summary && (
            <div className={styles.infoActionLine}>
              <span className={styles.infoActionText}>{activeSegment.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="md"
      // Render inline (not in a body portal) so the modal stays inside the
      // fullscreen subtree. Otherwise it'd be hidden by the browser when the
      // video container is fullscreened.
      withinPortal={false}
      classNames={{ title: styles.infoModalTitle }}
    >
      {body}
    </Modal>
  );
}
