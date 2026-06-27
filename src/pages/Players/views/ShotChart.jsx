import { useMemo } from 'react'
import { displayShotChart } from '../../../lib/statDisplay.js'
import ShotChartSVG from '../../../components/ShotChartSVG/ShotChartSVG.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import styles from './views.module.css'

export default function ShotChart({ statsData, playerId }) {
  const d = useMemo(() => displayShotChart(statsData, playerId), [statsData, playerId])
  if (!d.shots.length) {
    return <div className={styles.section}><p className={styles.placeholder}>No shots recorded.</p></div>
  }

  return (
    <div className={styles.section}>
      <ShotChartSVG shots={d.shots} showList={true} />
      <div className={styles.breakdownGrid}>
        <div>
          <div className={styles.subTitle}>Zone Breakdown</div>
          <DataTable desc={d.zoneBreakdown} />
        </div>
        <div>
          <div className={styles.subTitle}>Contest Breakdown</div>
          <DataTable desc={d.contestBreakdown} />
        </div>
      </div>
    </div>
  )
}
