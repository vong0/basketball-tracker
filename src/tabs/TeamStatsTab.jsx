import BoxscoreGrid from './shared/BoxscoreGrid.jsx'
import ShootingSplits from './shared/ShootingSplits.jsx'
import StatTable from './shared/StatTable.jsx'
import { calculateBoxScore, calculateTeamBoxScore, pctText } from '../lib/statsCore.js'
import { gameLabel } from '../lib/backend.js'
import tabStyles from './tabs.module.css'

// statsData: raw stats data
// scopeType: 'career' | 'season' | 'game'
// seasonVal: e.g. '2026-S2'
// gameId: e.g. '2026-S2-G1'
// allGames: full game list (for game table in career/season view)
export default function TeamStatsTab({ statsData, scopeType, seasonVal, gameId, allGames }) {
  if (!statsData) return <p className={tabStyles.placeholder}>Loading stats…</p>

  if (scopeType === 'game') {
    const team = calculateTeamBoxScore(statsData)
    const playerRows = calculateBoxScore(statsData)
    return (
      <>
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>Team</div>
          <BoxscoreGrid row={team} hidepm />
          <ShootingSplits row={team} />
        </div>
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>Players</div>
          <StatTable
            rows={playerRows}
            cols={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'PTS',    label: 'PTS' },
              { key: 'REB',    label: 'REB' },
              { key: 'AST',    label: 'AST' },
              { key: 'FG',     label: 'FG' },
              { key: 'threes', label: '3P' },
            ]}
            getRow={r => ({
              player: r.player,
              PTS: r.PTS, REB: r.REB, AST: r.AST,
              FG: `${r.FGM}/${r.FGA}`,
              threes: `${r.threePM}/${r.threePA}`,
            })}
            nameKey="player"
          />
        </div>
      </>
    )
  }

  const team = calculateTeamBoxScore(statsData)
  const scopedGames = (allGames ?? []).filter(g => {
    if (seasonVal) return g.season === seasonVal
    return true
  })

  return (
    <>
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>Team Totals</div>
        <div className={tabStyles.statCards}>
          {[['PTS', team.PTS], ['REB', team.REB], ['AST', team.AST], ['STL', team.STL], ['BLK', team.BLK], ['TO', team.TO]].map(([lbl, val]) => (
            <div key={lbl} className={tabStyles.statCard}>
              <div className={tabStyles.statCardVal}>{val}</div>
              <div className={tabStyles.statCardLbl}>{lbl}</div>
            </div>
          ))}
        </div>
        <div className={tabStyles.statSubRow}>
          <span className={tabStyles.statChip}>{team.FGM}/{team.FGA} FG ({pctText(team.FG_pct)})</span>
          <span className={tabStyles.statChip}>{team.threePM}/{team.threePA} 3P ({pctText(team.threeP_pct)})</span>
        </div>
      </div>
      {scopedGames.length > 0 && (
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>Games</div>
          <StatTable
            rows={scopedGames}
            cols={[
              { key: 'label',    label: 'Game',     align: 'left' },
              { key: 'result',   label: 'Result' },
              { key: 'score',    label: 'Score' },
              { key: 'opponent', label: 'Opponent',  align: 'left' },
            ]}
            getRow={g => ({
              label: gameLabel(g),
              result: g.result,
              score: `${g.teamScore}–${g.opponentScore}`,
              opponent: g.opponentName,
            })}
            nameKey="label"
          />
        </div>
      )}
    </>
  )
}
