import styles from './TabBar.module.css'

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {tabs.map(t => (
          <button
            key={t}
            className={t === active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => onChange(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
