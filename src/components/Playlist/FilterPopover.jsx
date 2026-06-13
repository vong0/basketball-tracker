import { Modal, Select } from '@mantine/core';
import styles from './FilterPopover.module.css';
import { EMPTY_CHOICE } from '../../lib/deriveFilterOptions';

/**

 * Filter UI body. Three single-select combo boxes (Players / Rating /
 * Possession), each with an explicit "Any" option for clearing that
 * dimension. Sections with no real options (e.g. game has no Bad-rated
 * actions) are hidden entirely.
 */
function FilterBody({ choice, setChoice, options, visible, total }) {
  const reset = () => setChoice(EMPTY_CHOICE);

  // Build option lists. "Any" is always the first entry; we use empty
  // string as its value because Mantine's Select treats null/undefined
  // as "no value picked" and will show the placeholder instead of "Any".
  const playerData = [
    { value: '', label: 'Any' },
    ...(options.hasOpponents ? [{ value: 'opponents', label: 'Opponents' }] : []),
    ...options.players.map(p => ({ value: p, label: p })),
  ];

  const ratingData = [
    { value: '', label: 'Any' },
    ...(options.ratings.includes('G') ? [{ value: 'G', label: 'Good' }] : []),
    ...(options.ratings.includes('B') ? [{ value: 'B', label: 'Bad' }] : []),
  ];

  const possessionData = [
    { value: '', label: 'Any' },
    ...(options.possessions.includes('offense') ? [{ value: 'offense', label: 'Offense' }] : []),
    ...(options.possessions.includes('defense') ? [{ value: 'defense', label: 'Defense' }] : []),
  ];

  // Mantine's Select returns the selected `value` string. We translate
  // empty string back to `null` for our internal choice shape (which is
  // what `buildFilter` expects).
  const onPlayerChange = (v) => setChoice({ ...choice, player: v || null });
  const onRatingChange = (v) => setChoice({ ...choice, rating: v || null });
  const onPossessionChange = (v) => setChoice({ ...choice, possession: v || null });

  // Hide a section if it would only contain "Any" (i.e. nothing real to
  // pick). For Players we also hide if there are no us-team players AND
  // no opponents.
  const showPlayers = playerData.length > 1;
  const showRating = ratingData.length > 1;
  const showPossession = possessionData.length > 1;

  return (
    <div className={styles.body}>
      <div className={styles.countLine}>
        {visible} of {total} selected
      </div>

      {showPlayers && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Players</div>
          <Select
            data={playerData}
            value={choice.player ?? ''}
            onChange={onPlayerChange}
            allowDeselect={false}
            maxDropdownHeight={200}
            scrollAreaProps={{ type: 'always' }}
            classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
            comboboxProps={{ withinPortal: false }}
          />
        </div>
      )}

      {showRating && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Rating</div>
          <Select
            data={ratingData}
            value={choice.rating ?? ''}
            onChange={onRatingChange}
            allowDeselect={false}
            maxDropdownHeight={200}
            classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
            comboboxProps={{ withinPortal: false }}
          />
        </div>
      )}

      {showPossession && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Possession</div>
          <Select
            data={possessionData}
            value={choice.possession ?? ''}
            onChange={onPossessionChange}
            allowDeselect={false}
            maxDropdownHeight={200}
            classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
            comboboxProps={{ withinPortal: false }}
          />
        </div>
      )}

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
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="FILTERS"
      centered
      size="sm"
      classNames={{ title: styles.modalTitle }}
    >
      <FilterBody
        choice={choice}
        setChoice={setChoice}
        options={options}
        visible={visible}
        total={total}
      />
    </Modal>
  );
}
