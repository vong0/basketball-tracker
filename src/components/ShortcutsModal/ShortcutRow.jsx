import styles from './ShortcutsModal.module.css';

export default function ShortcutRow({ kbd, desc }) {
  return (
    <div className={styles.row}>
      <span className={styles.kbd}>{kbd}</span>
      <span className={styles.desc}>{desc}</span>
    </div>
  );
}
