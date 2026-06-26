import styles from './Clips.module.css'

// playlists: [{ label, count, href }]
export default function Clips({ playlists }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.grid}>
        {playlists.map(pl => (
          <div key={pl.label} className={styles.card}>
            <div className={styles.cardLabel}>{pl.label}</div>
            <div className={styles.cardCount}>{pl.count}</div>
            <div className={styles.cardMeta}>clips</div>
            <a href={pl.href} className={styles.watchLink}>▶ Watch</a>
          </div>
        ))}
      </div>
    </div>
  )
}
