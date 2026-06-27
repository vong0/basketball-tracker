import { useMemo } from 'react'
import { displayPlayerAdvancedStats } from '../../../lib/statDisplay.js'
import GroupRow from '../../../components/GroupRow/GroupRow.jsx'
import styles from './views.module.css'

const SECTIONS = [
  { key: 'scoring',   label: 'Points & Efficiency' },
  { key: 'creation',  label: 'Creation & Passing' },
  { key: 'screening', label: 'Screening' },
  { key: 'defense',   label: 'Rebounding & Defense' },
  { key: 'lineup',    label: 'Lineup Impact' },
]

export default function Advanced({ statsData, playerId }) {
  const d = useMemo(() => displayPlayerAdvancedStats(statsData, playerId), [statsData, playerId])
  if (!d) return null

  return (
    <div>
      <div className={styles.subNav}>
        {SECTIONS.map(s => (
          <button key={s.key} className={styles.subNavBtn}
            onClick={() => document.getElementById(`adv-${s.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {s.label}
          </button>
        ))}
      </div>

      {SECTIONS.map(s => (
        <section key={s.key} id={`adv-${s.key}`} className={styles.section}>
          <div className={styles.subTitle}>{s.label}</div>
          <GroupRow groups={d[s.key]} />
        </section>
      ))}
    </div>
  )
}
