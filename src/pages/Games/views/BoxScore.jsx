import { useMemo } from 'react'
import { getAllPlayersAdvancedTable, GAME_BOX_SCORE_COLS } from '../../../lib/statsCore.js'
import StatTable from '../../../components/StatTable/StatTable.jsx'
import styles from './views.module.css'

export default function BoxScore({ statsData, players }) {
  const rows = useMemo(() => getAllPlayersAdvancedTable(statsData), [statsData])
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])

  return (
    <div className={styles.section}>
      <StatTable
        rows={rows}
        cols={GAME_BOX_SCORE_COLS}
        getRow={r => ({ ...r, player: nameMap[r.player] || r.player })}
        nameKey="player"
      />
    </div>
  )
}
