import StatCard from '../StatCard/StatCard.jsx'
import styles from './StatCardGrid.module.css'

export default function StatCardGrid({ cards = [], cols = 3 }) {
  if (!cards.length) return null
  return (
    <div className={styles.grid} style={{ '--cols': cols }}>
      {cards.map(c => <StatCard key={c.key} label={c.label} value={c.value} secondary={c.secondary} />)}
    </div>
  )
}
