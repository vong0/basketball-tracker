import { useMemo } from 'react'
import { getPlayerAdvancedTabs } from '../../../lib/statsCore.js'
import styles from './views.module.css'

const SECTION_KEYS = ['scoring', 'creation', 'screening', 'defense', 'lineup']
const SECTION_TITLES = {
  scoring:  'Points & Efficiency',
  creation: 'Creation & Passing',
  screening: 'Screening',
  defense:  'Rebounding & Defense',
  lineup:   'Lineup Impact',
}

function AdvCards({ cards }) {
  return (
    <div className={styles.advCol}>
      {(cards ?? []).map(c => (
        <div key={c.key} className={styles.advRow}>
          <span className={styles.advLabel}>{c.label}</span>
          <span className={styles.advValue}>{c.value ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

export default function Advanced({ statsData, playerId }) {
  const adv = useMemo(() => getPlayerAdvancedTabs(statsData, playerId), [statsData, playerId])
  if (!adv) return null

  const sectionCards = {
    scoring:   [...adv.scoring.points_efficiency, ...adv.scoring.shot_quality],
    creation:  adv.creation_passing,
    screening: adv.screening,
    defense:   adv.rebounding_defense,
    lineup:    adv.lineup_impact,
  }

  return (
    <div>
      <div className={styles.subNav}>
        {SECTION_KEYS.map(s => (
          <button key={s} className={styles.subNavBtn}
            onClick={() => document.getElementById(`adv-${s}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {SECTION_TITLES[s]}
          </button>
        ))}
      </div>

      {SECTION_KEYS.map(key => (
        <section key={key} id={`adv-${key}`} className={styles.section}>
          <div className={styles.subTitle}>{SECTION_TITLES[key]}</div>
          <div className={styles.advGrid}>
            <AdvCards cards={sectionCards[key]} />
          </div>
        </section>
      ))}
    </div>
  )
}
