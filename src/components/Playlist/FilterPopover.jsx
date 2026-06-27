import { Modal, Select } from '@mantine/core';
import styles from './FilterPopover.module.css';

function FilterBody({ choice, setChoice, options, visible, total }) {
  const reset = () => setChoice({ player: null, preset: 'all' });

  const playerData = [
    { value: '', label: 'Any' },
    ...(options.hasOpponents ? [{ value: 'opponents', label: 'Opponents' }] : []),
    ...options.players.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
  ];

  const presetData = [
    { value: 'all',         label: 'All' },
    { value: 'goodOffense', label: 'Good Offense' },
    { value: 'goodDefense', label: 'Good Defense' },
    { value: 'badOffense',  label: 'Bad Offense' },
    { value: 'badDefense',  label: 'Bad Defense' },
  ];

  const onPlayerChange = (v) => setChoice({ ...choice, player: v || null });
  const onPresetChange = (v) => setChoice({ ...choice, preset: v || 'all' });

  const showPlayers = playerData.length > 1;

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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Preset</div>
        <Select
          data={presetData}
          value={choice.preset ?? 'all'}
          onChange={onPresetChange}
          allowDeselect={false}
          maxDropdownHeight={200}
          classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown }}
          comboboxProps={{ withinPortal: false }}
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
