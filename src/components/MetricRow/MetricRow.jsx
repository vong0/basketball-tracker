import styles from './MetricRow.module.css'

export default function MetricRow({ cards = [], cols = 4 }) {
  if (!cards.length) return null
  return (
    <div className={styles.row} style={{ '--cols': cols }}>
      {cards.map((c, i) => (
        <div key={c.label + i} className={styles.card}>
          <div className={styles.label}>{c.label}</div>
          <div className={styles.main}>{c.main ?? '—'}</div>
          {c.secondary !== undefined && <div className={styles.secondary}>{c.secondary}</div>}
          {c.sub !== undefined && <div className={styles.sub}>{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}
