import styles from './StatCard.module.css'

export default function StatCard({ label, value, secondary }) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value ?? '—'}</div>
      {secondary !== undefined && <div className={styles.secondary}>{secondary}</div>}
    </div>
  )
}
