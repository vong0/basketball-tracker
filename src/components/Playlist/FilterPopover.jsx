import { Modal, Select } from '@mantine/core';
import styles from './FilterPopover.module.css';

function FilterBody({ choice, setChoice, options, visible, total }) {
  const reset = () => setChoice({ player: null, rating: null, possession: null });

  const playerData = [
    { value: '', label: 'Any' },
    ...(options.hasOpponents ? [{ value: 'opponents', label: 'Opponents' }] : []),
    ...options.players.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
  ];
  const ratingData = [
    { value: '', label: 'Any' },
    { value: 'G', label: 'Good' },
    { value: 'B', label: 'Bad' },
  ];
  const possessionData = [
    { value: '', label: 'Any' },
    { value: 'offense', label: 'Offense' },
    { value: 'defense', label: 'Defense' },
  ];

  const onPlayerChange     = (v) => setChoice({ ...choice, player: v || null });
  const onRatingChange     = (v) => setChoice({ ...choice, rating: v || null });
  const onPossessionChange = (v) => setChoice({ ...choice, possession: v || null });

  const showPlayers = playerData.length > 1;

  return (
    <div className={styles.body}>
      <div className={styles.countLine}>
        {visible} of {total} selected
      </div>

      {showPlayers && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Player</div>
          <Select
            data={playerData}
            value={choice.player ?? ''}
            onChange={onPlayerChange}
            allowDeselect={false}
            maxDropdownHeight={200}
            classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
          />
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Rating</div>
        <Select
          data={ratingData}
          value={choice.rating ?? ''}
          onChange={onRatingChange}
          allowDeselect={false}
          maxDropdownHeight={200}
          classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Possession</div>
        <Select
          data={possessionData}
          value={choice.possession ?? ''}
          onChange={onPossessionChange}
          allowDeselect={false}
          maxDropdownHeight={200}
          classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
        />
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
