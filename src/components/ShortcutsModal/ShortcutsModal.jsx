import { Modal } from '@mantine/core';
import styles from './ShortcutsModal.module.css';

const desktopShortcuts = [
  {
    title: 'Video',
    items: [
      ['Space', 'Play / pause'],
      ['← / →', 'Back / forward 1s (hold to repeat)'],
      [', / .', 'Frame back / forward'],
      ['Hold ⇧', '2× speed (while held)'],
      ['Hold ⌃', '0.5× speed (while held)'],
      ['J / K', 'Previous / next segment'],
      ['F', 'Toggle fullscreen']
    ]
  },
  {
    title: 'Other',
    items: [
      ['? / /', 'Toggle this overlay'],
      ['Esc', 'Close / exit fullscreen']
    ]
  }
];

const mobileGestures = [
  ['Tap', 'Show / hide controls'],
  ['Double-tap left', 'Back 1s'],
  ['Double-tap right', 'Forward 1s'],
  ['Long-press left', '0.5× speed (while held)'],
  ['Long-press right', '2× speed (while held)']
];

export default function ShortcutsModal({ open, onClose, isMobile }) {
  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={isMobile ? 'GESTURES' : 'KEYBOARD SHORTCUTS'}
      centered
      size="md"
      classNames={{ title: styles.modalTitle }}
    >
      {isMobile ? (
        <div>
          <div className={styles.sectionTitle}>VIDEO</div>
          <div className={styles.list}>
            {mobileGestures.map(([gesture, desc], i) => (
              <div key={i} className={styles.row}>
                <span className={styles.kbd} style={{ minWidth: 140 }}>{gesture}</span>
                <span className={styles.desc}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        desktopShortcuts.map((group, gi) => (
          <div key={gi} className={styles.group}>
            <div className={styles.sectionTitle}>{group.title}</div>
            <div className={styles.list}>
              {group.items.map(([key, desc], i) => (
                <div key={i} className={styles.row}>
                  <span className={styles.kbd}>{key}</span>
                  <span className={styles.desc}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </Modal>
  );
}
