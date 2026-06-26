import { useMemo } from 'react'
import { getStatLeaders } from '../../../lib/statsCore.js'
import StatTable from '../../../components/StatTable/StatTable.jsx'
import styles from './views.module.css'

const SCORING_COLS = [
  { key: 'player', label: 'Player', align: 'left' },
  { key: 'PTS', label: 'PTS' }, { key: 'FG', label: 'FG' },
  { key: 'threePoint', label: '3PT' }, { key: 'FT', label: 'FT' },
  { key: 'eFG_pct', label: 'eFG%' }, { key: 'TS_pct', label: 'TS%' },
  { key: 'PTS_per_Poss', label: 'PTS/P' }, { key: 'Usage_pct', label: 'USG%' },
]
const CREATION_COLS = [
  { key: 'player', label: 'Player', align: 'left' },
  { key: 'AST', label: 'AST' }, { key: 'AST_PTS', label: 'AST PTS' },
  { key: 'Extra_Potential_AST', label: 'POT AST' },
  { key: 'ADV_Created', label: 'ADV' }, { key: 'ADV_PTS', label: 'ADV PTS' },
  { key: 'Paint_Touch_Created', label: 'PAINT' },
  { key: 'Drive_Kick_Created', label: 'DRV/KICK' }, { key: 'AST_TO', label: 'A/TO' },
]
const SCREENING_COLS = [
  { key: 'player', label: 'Player', align: 'left' },
  { key: 'Screen_AST', label: 'SCR AST' },
  { key: 'Screen_Opp_Created', label: 'SCR OPP' },
  { key: 'Screen_Adv_Created', label: 'SCR ADV' },
  { key: 'Screen_Created_Total', label: 'TOTAL' },
  { key: 'PTS_per_Screen', label: 'PTS/SCR' },
]
const REBDEF_COLS = [
  { key: 'player', label: 'Player', align: 'left' },
  { key: 'OR', label: 'OR' }, { key: 'DR', label: 'DR' }, { key: 'REB', label: 'REB' },
  { key: 'STL', label: 'STL' }, { key: 'BLK', label: 'BLK' },
  { key: 'Deflections', label: 'DEF' }, { key: 'Charges', label: 'CHG' },
  { key: 'Def_Activity', label: 'DEF ACT' },
]

export default function StatLeaders({ statsData, players }) {
  const leaders = useMemo(() => getStatLeaders(statsData), [statsData])
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])
  const mapRow = r => ({ ...r, player: nameMap[r.player] || r.player })

  return (
    <div className={styles.section}>
      <div className={styles.leadersGrid}>
        <div>
          <div className={styles.subTitle}>Scoring</div>
          <StatTable rows={leaders.scoring} cols={SCORING_COLS} getRow={mapRow} nameKey="player" />
        </div>
        <div>
          <div className={styles.subTitle}>Creation &amp; Passing</div>
          <StatTable rows={leaders.creation} cols={CREATION_COLS} getRow={mapRow} nameKey="player" />
        </div>
        <div>
          <div className={styles.subTitle}>Screening</div>
          <StatTable rows={leaders.screening} cols={SCREENING_COLS} getRow={mapRow} nameKey="player" />
        </div>
        <div>
          <div className={styles.subTitle}>Rebounding &amp; Defense</div>
          <StatTable rows={leaders.rebounding_defense} cols={REBDEF_COLS} getRow={mapRow} nameKey="player" />
        </div>
      </div>
    </div>
  )
}
