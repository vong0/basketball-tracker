import { Modal } from '@mantine/core';
import { desktopShortcuts, mobileGestures } from './shortcutsData';
import ShortcutRow from './ShortcutRow';
import styles from './ShortcutsModal.module.css';

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
        <div className={styles.list}>
          {mobileGestures.map(([gesture, desc], i) => (
            <ShortcutRow key={i} kbd={gesture} desc={desc} />
          ))}
        </div>
      ) : (
        desktopShortcuts.map((group, gi) => (
          <div key={gi} className={styles.group}>
            <div className={styles.sectionTitle}>{group.title}</div>
            <div className={styles.list}>
              {group.items.map(([key, desc], i) => (
                <ShortcutRow key={i} kbd={key} desc={desc} />
              ))}
            </div>
          </div>
        ))
      )}
    </Modal>
  );
}
