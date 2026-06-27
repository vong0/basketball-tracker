import { useMemo } from 'react'
import { displayPlayerBoxScore } from '../../../lib/statsCore.js'
import MetricRow from '../../../components/MetricRow/MetricRow.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import styles from './views.module.css'

export default function BoxScore({ statsData, playerId, scopeType, games }) {
  const d = useMemo(
    () => displayPlayerBoxScore(statsData, playerId, scopeType, games ?? []),
    [statsData, playerId, scopeType, games]
  )

  if (!statsData) return <div className={styles.section}><p className={styles.placeholder}>Loading…</p></div>

  return (
    <div className={styles.section}>
      {d.metrics.length > 0 && (
        <>
          {scopeType !== 'game' && <div className={styles.subTitle}>Averages</div>}
          <MetricRow cards={d.metrics} cols={scopeType === 'game' ? 4 : 5} />
        </>
      )}
      {d.gameLog && (
        <>
          <div className={styles.subTitle}>Game Log</div>
          <DataTable desc={d.gameLog} />
        </>
      )}
    </div>
  )
}
