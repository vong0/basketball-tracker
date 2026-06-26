import { useMemo } from 'react'
import { getPlayerGameLog, getPlayerSeasonAverages } from '../../../lib/statsCore.js'
import StatTable from '../../../components/StatTable/StatTable.jsx'
import StatCardGrid from '../../../components/StatCardGrid/StatCardGrid.jsx'
import styles from './views.module.css'

const GAME_LOG_COLS = [
  { key: 'game_id', label: 'Game', align: 'left' },
  { key: 'PTS', label: 'PTS' }, { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' }, { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' }, { key: 'TO', label: 'TO' },
  { key: 'FG', label: 'FG' }, { key: 'threePoint', label: '3PT' },
  { key: 'FT', label: 'FT' }, { key: 'pm', label: '+/-' },
]

export default function BoxScore({ statsData, playerId, scopeType, games }) {
  const gameLog = useMemo(() => {
    if (!statsData || scopeType === 'game') return null
    return getPlayerGameLog(statsData, playerId)
  }, [statsData, playerId, scopeType])

  const averages = useMemo(() => gameLog ? getPlayerSeasonAverages(gameLog) : null, [gameLog])
  const gamesMap = useMemo(() => Object.fromEntries((games ?? []).map(g => [g.id, g])), [games])

  if (!statsData) return <div className={styles.section}><p className={styles.placeholder}>Loading…</p></div>

  if (scopeType === 'game') {
    const fg = statsData.shots.filter(s => s.player === playerId)
    const fts = statsData.freeThrows.filter(ft => ft.player === playerId)
    const madeShots = fg.filter(s => String(s.result).toLowerCase() === 'make')
    const made3 = fg.filter(s => Number(s.points) === 3 && String(s.result).toLowerCase() === 'make')
    const att3  = fg.filter(s => Number(s.points) === 3)
    const FTM = fts.filter(ft => String(ft.result).toLowerCase() === 'make').length
    const FTA = fts.length
    const PTS = madeShots.reduce((t, s) => t + Number(s.points), 0) + FTM
    const quickCards = [
      { key: 'PTS', label: 'PTS', value: PTS },
      { key: 'FG', label: 'FG', value: `${madeShots.length}/${fg.length}`, secondary: fg.length ? `${((madeShots.length / fg.length) * 100).toFixed(1)}%` : '—' },
      { key: '3PT', label: '3PT', value: `${made3.length}/${att3.length}`, secondary: att3.length ? `${((made3.length / att3.length) * 100).toFixed(1)}%` : '—' },
      { key: 'FT', label: 'FT', value: `${FTM}/${FTA}`, secondary: FTA ? `${((FTM / FTA) * 100).toFixed(1)}%` : '—' },
    ]
    return (
      <div className={styles.section}>
        <StatCardGrid cards={quickCards} cols={4} />
      </div>
    )
  }

  return (
    <div className={styles.section}>
      {averages && (
        <>
          <div className={styles.subTitle}>Averages</div>
          <StatCardGrid cards={averages} cols={5} />
        </>
      )}
      {gameLog && gameLog.length > 0 && (
        <>
          <div className={styles.subTitle}>Game Log</div>
          <StatTable
            rows={gameLog}
            cols={GAME_LOG_COLS}
            getRow={r => {
              const g = gamesMap[r.game_id]
              return { ...r, game_id: g ? `${g.opponentName} (${g.result ?? ''})` : r.game_id }
            }}
            nameKey="game_id"
          />
        </>
      )}
    </div>
  )
}
