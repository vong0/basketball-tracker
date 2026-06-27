import { useMemo } from 'react'
import { displayGameBoxScore } from '../../../lib/statsCore.js'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import styles from './views.module.css'

export default function BoxScore({ statsData, players }) {
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])
  const d = useMemo(() => displayGameBoxScore(statsData, nameMap), [statsData, nameMap])

  return (
    <div className={styles.section}>
      <DataTable desc={d.table} />
    </div>
  )
}
