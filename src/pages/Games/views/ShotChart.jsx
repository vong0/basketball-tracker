import { useMemo } from 'react'
import { getShotChartData } from '../../../lib/statsCore.js'
import ShotChartSVG from '../../../components/ShotChartSVG/ShotChartSVG.jsx'
import StatTable from '../../../components/StatTable/StatTable.jsx'
import styles from './views.module.css'

const ZONE_COLS = [
  { key: 'label', label: 'Zone', align: 'left' },
  { key: 'FG', label: 'FG' }, { key: 'FG_pct', label: 'FG%' },
  { key: 'rate', label: 'RATE' }, { key: 'PTS', label: 'PTS' }, { key: 'PPS', label: 'PPS' },
]
const CONTEST_COLS = [
  { key: 'label', label: 'Contest', align: 'left' },
  { key: 'FG', label: 'FG' }, { key: 'FG_pct', label: 'FG%' },
  { key: 'rate', label: 'RATE' }, { key: 'PTS', label: 'PTS' }, { key: 'PPS', label: 'PPS' },
]

export default function ShotChart({ statsData }) {
  const { shots, zone_breakdown, contest_breakdown } = useMemo(() => getShotChartData(statsData), [statsData])
  if (!shots.length) return <div className={styles.section}><p className={styles.placeholder}>No shot data.</p></div>
  return (
    <div className={styles.section}>
      <ShotChartSVG shots={shots} showList={true} />
      <div className={styles.breakdownGrid}>
        <div>
          <div className={styles.subTitle}>Zone Breakdown</div>
          <StatTable
            rows={zone_breakdown.filter(z => z.FGA > 0)}
            cols={ZONE_COLS}
            getRow={z => z}
            nameKey="label"
          />
        </div>
        <div>
          <div className={styles.subTitle}>Contest Breakdown</div>
          <StatTable
            rows={contest_breakdown.filter(z => z.FGA > 0)}
            cols={CONTEST_COLS}
            getRow={z => z}
            nameKey="label"
          />
        </div>
      </div>
    </div>
  )
}
