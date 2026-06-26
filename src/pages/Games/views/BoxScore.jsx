import { useMemo } from 'react'
import { getAllPlayersAdvancedTable } from '../../../lib/statsCore.js'
import StatTable from '../../../components/StatTable/StatTable.jsx'
import styles from './views.module.css'

const COLS = [
  { key: 'player',                label: 'Player',    align: 'left' },
  { key: 'PTS',                   label: 'PTS' },
  { key: 'Usage_pct',             label: 'USG%' },
  { key: 'FG',                    label: 'FG' },
  { key: 'threePoint',            label: '3PT' },
  { key: 'FT',                    label: 'FT' },
  { key: 'AST',                   label: 'AST' },
  { key: 'Extra_Potential_AST',   label: 'POT' },
  { key: 'Advantage_Created',     label: 'ADV' },
  { key: 'Screen_OppAst_Created', label: 'SCR' },
  { key: 'REB',                   label: 'REB' },
  { key: 'STL',                   label: 'STL' },
  { key: 'BLK',                   label: 'BLK' },
  { key: 'Deflections',           label: 'DEF' },
  { key: 'TOV',                   label: 'TO' },
  { key: 'Open_pct',              label: 'OPEN%' },
  { key: 'Bad_pct',               label: 'BAD%' },
  { key: 'plus_minus',            label: '+/-' },
]

export default function BoxScore({ statsData, players }) {
  const rows = useMemo(() => getAllPlayersAdvancedTable(statsData), [statsData])
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])

  return (
    <div className={styles.section}>
      <StatTable
        rows={rows}
        cols={COLS}
        getRow={r => ({ ...r, player: nameMap[r.player] || r.player })}
        nameKey="player"
      />
    </div>
  )
}
