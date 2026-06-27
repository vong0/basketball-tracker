import { useMemo } from 'react'
import {
  getStatLeaders,
  STAT_LEADERS_SCORING_COLS,
  STAT_LEADERS_CREATION_COLS,
  STAT_LEADERS_SCREENING_COLS,
  STAT_LEADERS_REBDEF_COLS,
} from '../../../lib/statsCore.js'
import StatTable from '../../../components/StatTable/StatTable.jsx'
import styles from './views.module.css'

export default function StatLeaders({ statsData, players }) {
  const leaders = useMemo(() => getStatLeaders(statsData), [statsData])
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])
  const mapRow = r => ({ ...r, player: nameMap[r.player] || r.player })

  return (
    <div className={styles.section}>
      <div className={styles.leadersGrid}>
        <div>
          <div className={styles.subTitle}>Scoring</div>
          <StatTable rows={leaders.scoring} cols={STAT_LEADERS_SCORING_COLS} getRow={mapRow} nameKey="player" />
        </div>
        <div>
          <div className={styles.subTitle}>Creation &amp; Passing</div>
          <StatTable rows={leaders.creation} cols={STAT_LEADERS_CREATION_COLS} getRow={mapRow} nameKey="player" />
        </div>
        <div>
          <div className={styles.subTitle}>Screening</div>
          <StatTable rows={leaders.screening} cols={STAT_LEADERS_SCREENING_COLS} getRow={mapRow} nameKey="player" />
        </div>
        <div>
          <div className={styles.subTitle}>Rebounding &amp; Defense</div>
          <StatTable rows={leaders.rebounding_defense} cols={STAT_LEADERS_REBDEF_COLS} getRow={mapRow} nameKey="player" />
        </div>
      </div>
    </div>
  )
}
