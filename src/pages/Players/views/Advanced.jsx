import { useMemo } from 'react'
import { getPlayerAdvancedTabs } from '../../../lib/statsCore.js'
import StatCardGrid from '../../../components/StatCardGrid/StatCardGrid.jsx'
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

const SECTION_KEYS = ['scoring', 'creation', 'screening', 'defense', 'lineup']
const SECTION_TITLES = { scoring: 'Scoring', creation: 'Creation', screening: 'Screening', defense: 'Defense', lineup: 'Lineup' }

export default function Advanced({ statsData, playerId }) {
  const adv = useMemo(() => getPlayerAdvancedTabs(statsData, playerId), [statsData, playerId])
  if (!adv) return null

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

      <section id="adv-scoring" className={styles.section}>
        <div className={styles.subTitle}>Points &amp; Efficiency</div>
        <div className={styles.scoringGrid}>
          <StatCardGrid cards={adv.scoring.points_efficiency} cols={2} />
          <StatCardGrid cards={adv.scoring.shot_quality} cols={2} />
        </div>
        {adv.scoring.shot_chart.shots.length > 0 && (
          <ShotChartSVG shots={adv.scoring.shot_chart.shots} showList={true} />
        )}
        <div className={styles.breakdownGrid}>
          <div>
            <div className={styles.subTitle}>Zone Breakdown</div>
            <StatTable rows={adv.scoring.shot_chart.zone_breakdown.filter(z => z.FGA > 0)}
              cols={ZONE_COLS} getRow={z => z} nameKey="label" />
          </div>
          <div>
            <div className={styles.subTitle}>Contest Breakdown</div>
            <StatTable rows={adv.scoring.shot_chart.contest_breakdown.filter(z => z.FGA > 0)}
              cols={CONTEST_COLS} getRow={z => z} nameKey="label" />
          </div>
        </div>
      </section>

      <section id="adv-creation" className={styles.section}>
        <div className={styles.subTitle}>Creation &amp; Passing</div>
        <StatCardGrid cards={adv.creation_passing} cols={3} />
      </section>

      <section id="adv-screening" className={styles.section}>
        <div className={styles.subTitle}>Screening</div>
        <StatCardGrid cards={adv.screening} cols={3} />
      </section>

      <section id="adv-defense" className={styles.section}>
        <div className={styles.subTitle}>Rebounding &amp; Defense</div>
        <StatCardGrid cards={adv.rebounding_defense} cols={3} />
      </section>

      <section id="adv-lineup" className={styles.section}>
        <div className={styles.subTitle}>Lineup Impact</div>
        <StatCardGrid cards={adv.lineup_impact} cols={3} />
      </section>
    </div>
  )
}
