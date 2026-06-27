import { useMemo } from 'react'
import { displayGameStatLeaders } from '../../../lib/statsCore.js'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import styles from './views.module.css'

const SECTIONS = [
  { key: 'scoring',   label: 'Scoring' },
  { key: 'creation',  label: 'Creation \u0026 Passing' },
  { key: 'screening', label: 'Screening' },
  { key: 'defense',   label: 'Rebounding \u0026 Defense' },
]

export default function StatLeaders({ statsData, players }) {
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])
  const d = useMemo(() => displayGameStatLeaders(statsData, nameMap), [statsData, nameMap])

  return (
    <div className={styles.section}>
      <div className={styles.leadersGrid}>
        {SECTIONS.map(({ key, label }) => (
          <div key={key}>
            <div className={styles.subTitle}>{label}</div>
            <DataTable desc={d[key]} />
          </div>
        ))}
      </div>
    </div>
  )
}
