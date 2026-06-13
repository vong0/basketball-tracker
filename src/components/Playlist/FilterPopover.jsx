import { Modal } from '@mantine/core';
import styles from './FilterPopover.module.css';
import { EMPTY_CHOICE } from '../../lib/deriveFilterOptions';

/**

 * The filter UI body. Used inside both Popover (desktop) and Modal (mobile).
 */
function FilterBody({ choice, setChoice, options, visible, total }) {
  const setPlayer = (v) => setChoice({ ...choice, player: v });
  const setRating = (v) => setChoice({ ...choice, rating: v });
  const setPossession = (v) => setChoice({ ...choice, possession: v });

  const reset = () => setChoice(EMPTY_CHOICE);

  // Radio row: clicking the already-selected option does nothing
  // (per spec — to clear, pick "Any" or hit Reset).
  const Radio = ({ label, selected, onClick }) => (
    <button
      type="button"
      className={selected ? styles.optSelected : styles.opt}
      onClick={() => { if (!selected) onClick(); }}
    >
      <span className={styles.optDot}>{selected ? '●' : '○'}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className={styles.body}>
      <div className={styles.countLine}>
        {visible} of {total} selected
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Players</div>
        <div className={styles.options}>
          <Radio label="Any" selected={choice.player === null} onClick={() => setPlayer(null)} />
          {options.hasOpponents && (
            <Radio
              label="Opponents"
              selected={choice.player === 'opponents'}
              onClick={() => setPlayer('opponents')}
            />
          )}
          {options.players.map(p => (
            <Radio
              key={p}
              label={p}
              selected={choice.player === p}
              onClick={() => setPlayer(p)}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Rating</div>
        <div className={styles.options}>
          <Radio label="Any" selected={choice.rating === null} onClick={() => setRating(null)} />
          {options.ratings.includes('G') && (
            <Radio label="Good" selected={choice.rating === 'G'} onClick={() => setRating('G')} />
          )}
          {options.ratings.includes('B') && (
            <Radio label="Bad" selected={choice.rating === 'B'} onClick={() => setRating('B')} />
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Possession</div>
        <div className={styles.options}>
          <Radio label="Any" selected={choice.possession === null} onClick={() => setPossession(null)} />
          {options.possessions.includes('offense') && (
            <Radio
              label="Offense"
              selected={choice.possession === 'offense'}
              onClick={() => setPossession('offense')}
            />
          )}
          {options.possessions.includes('defense') && (
            <Radio
              label="Defense"
              selected={choice.possession === 'defense'}
              onClick={() => setPossession('defense')}
            />
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.resetBtn} onClick={reset}>
          Reset all
        </button>
      </div>
    </div>
  );
}

export default function FilterPopover({
  opened,
  onClose,
  choice,
  setChoice,
  options,
  visible,
  total,
}) {
  // Centered modal on both desktop and mobile. Keeps the popup off the
  // playlist (so rows stay visible) and gives a single focused place
  // to interact. Pause/resume is handled by the parent — the modal
  // doesn't auto-close on option clicks, so playback stays paused
  // for the entire interaction.
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="FILTERS"
      centered
      size="sm"
      classNames={{ title: styles.modalTitle }}
    >
      <FilterBody choice={choice} setChoice={setChoice} options={options} visible={visible} total={total} />
    </Modal>
  );
}
