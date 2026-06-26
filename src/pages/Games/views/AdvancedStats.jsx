import { useMemo } from 'react'
import { getTeamAdvancedStats } from '../../../lib/statsCore.js'
import styles from './views.module.css'

const SECTIONS = [
  { key: 'scoring_efficiency', title: 'Scoring & Efficiency' },
  { key: 'creation_passing',   title: 'Creation & Passing' },
  { key: 'screening',          title: 'Screening' },
  { key: 'rebounding_defense', title: 'Rebounding & Defense' },
  { key: 'shot_quality',       title: 'Shot Quality' },
  { key: 'lineup_impact',      title: 'Lineup Impact' },
]

export default function AdvancedStats({ statsData }) {
  const adv = useMemo(() => getTeamAdvancedStats(statsData), [statsData])
  return (
    <div className={styles.section}>
      <div className={styles.advGrid}>
        {SECTIONS.map(({ key, title }) => (
          <div key={key} className={styles.advCol}>
            <div className={styles.subTitle}>{title}</div>
            {(adv[key] ?? []).map(c => (
              <div key={c.key} className={styles.advRow}>
                <span className={styles.advLabel}>{c.label}</span>
                <span className={styles.advValue}>{c.value ?? '—'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
