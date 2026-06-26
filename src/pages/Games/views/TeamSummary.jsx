import { useMemo } from 'react'
import { getTeamSummaryCards } from '../../../lib/statsCore.js'
import StatCardGrid from '../../../components/StatCardGrid/StatCardGrid.jsx'
import styles from './views.module.css'

export default function TeamSummary({ statsData }) {
  const cards = useMemo(() => getTeamSummaryCards(statsData), [statsData])
  return (
    <div className={styles.section}>
      <StatCardGrid cards={cards} cols={6} />
    </div>
  )
}
