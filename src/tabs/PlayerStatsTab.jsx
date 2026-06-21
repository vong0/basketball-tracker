import BoxscoreGrid from './shared/BoxscoreGrid.jsx'
import ShootingSplits from './shared/ShootingSplits.jsx'
import GameLogTable from './shared/GameLogTable.jsx'
import SeasonSummaryTable from './shared/SeasonSummaryTable.jsx'
import { calculateBoxScore, calculateCareerAverages, pctText } from '../lib/statsCore.js'
import tabStyles from './tabs.module.css'

// statsData: raw data (from getStats)
// playerId: the player being viewed
// scopeType: 'career' | 'season' | 'game'
// gameLog: rows from getPlayerGameLog (season scope only)
// seasonSummary: rows from getPlayerSeasonSummary (career scope only)
export default function PlayerStatsTab({ statsData, playerId, scopeType, gameLog, seasonSummary }) {
  if (!statsData) return <p className={tabStyles.placeholder}>Loading stats…</p>

  if (scopeType === 'game') {
    const rows = calculateBoxScore(statsData, playerId)
    const r = rows[0]
    if (!r) return <p className={tabStyles.placeholder}>No stats for this game.</p>
    return (
      <div className={tabStyles.section}>
        <BoxscoreGrid row={r} />
        <ShootingSplits row={r} />
      </div>
    )
  }

  if (scopeType === 'season') {
    const rows = calculateBoxScore(statsData, playerId)
    const r = rows[0]
    return (
      <>
        {r && (
          <div className={tabStyles.section}>
            <div className={tabStyles.statCards}>
              {[['PPG', r.PTS ?? 0], ['RPG', r.REB ?? 0], ['APG', r.AST ?? 0], ['FG%', pctText(r.FG_pct)]].map(([lbl, val]) => (
                <div key={lbl} className={tabStyles.statCard}>
                  <div className={tabStyles.statCardVal}>{val}</div>
                  <div className={tabStyles.statCardLbl}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {gameLog && (
          <div className={tabStyles.section}>
            <div className={tabStyles.sectionTitle}>Game Log</div>
            <GameLogTable rows={gameLog} />
          </div>
        )}
      </>
    )
  }

  // Career
  const avgs = calculateCareerAverages(statsData, playerId)
  return (
    <>
      <div className={tabStyles.section}>
        <div className={tabStyles.statCards}>
          {[['PPG', avgs.PPG], ['RPG', avgs.RPG], ['APG', avgs.APG], ['FG%', pctText(avgs.FG_pct)]].map(([lbl, val]) => (
            <div key={lbl} className={tabStyles.statCard}>
              <div className={tabStyles.statCardVal}>{val}</div>
              <div className={tabStyles.statCardLbl}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
      {seasonSummary && (
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>By Season</div>
          <SeasonSummaryTable rows={seasonSummary} />
        </div>
      )}
    </>
  )
}
