import { Modal } from '@mantine/core';
import { parseLabel, dotKey, actionDisplayParts } from '../../lib/parseLabel';
import { formatTime } from '../../lib/time';
import styles from './VideoPlayer.module.css';

const DOT_CLASSES = {
  good:     styles.dotGood,
  bad:      styles.dotBad,
  opponent: styles.dotOpponent,
  neutral:  styles.dotNeutral,
};

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
            const { subject, note } = actionDisplayParts(a);
            const noDot = false;
            return (
              <div key={i} className={styles.infoActionLine}>
                {!noDot && <span className={`${styles.infoLineDot} ${DOT_CLASSES[dotKey(a)]}`} />}
                <span className={styles.infoActionText}>
                  {note
                    ? <><b>{subject}</b>{': '}{note}</>
                    : <b>{subject || activeSegment.name}</b>}
                </span>
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
