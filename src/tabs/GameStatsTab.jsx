import BoxscoreGrid from './shared/BoxscoreGrid.jsx'
import ShootingSplits from './shared/ShootingSplits.jsx'
import StatTable from './shared/StatTable.jsx'
import { calculateBoxScore, calculateTeamBoxScore, pctText } from '../lib/statsCore.js'
import tabStyles from './tabs.module.css'
import styles from './GameStatsTab.module.css'

// statsData: raw { shots, events, freeThrows, lineupStints }
// scope: '' (all players) | playerId
// players: [{ playerId, name }]
export default function GameStatsTab({ statsData, scope, players }) {
  if (!statsData) return <p className={tabStyles.placeholder}>Loading stats…</p>

  if (scope) {
    const rows = calculateBoxScore(statsData, scope)
    const r = rows[0]
    if (!r) return <p className={tabStyles.placeholder}>No stats for this player.</p>
    const name = players.find(p => p.playerId === scope)?.name ?? scope
    return (
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>{name}</div>
        <BoxscoreGrid row={r} />
        <ShootingSplits row={r} />
      </div>
    )
  }

  const team = calculateTeamBoxScore(statsData)
  const playerRows = calculateBoxScore(statsData)

  return (
    <>
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>Team</div>
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
          <span className={tabStyles.statChip}>{team.FTM}/{team.FTA} FT ({pctText(team.FT_pct)})</span>
        </div>
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
            { key: 'STL',    label: 'STL' },
            { key: 'BLK',    label: 'BLK' },
            { key: 'TO',     label: 'TO' },
            { key: 'pm',     label: '+/-' },
            { key: 'FG',     label: 'FG' },
            { key: 'threes', label: '3P' },
          ]}
          getRow={r => ({
            player: players.find(p => p.playerId === r.player)?.name ?? r.player,
            PTS: r.PTS, REB: r.REB, AST: r.AST, STL: r.STL, BLK: r.BLK, TO: r.TO,
            pm: r.pm >= 0 ? `+${r.pm}` : String(r.pm),
            FG: `${r.FGM}/${r.FGA}`,
            threes: `${r.threePM}/${r.threePA}`,
          })}
          nameKey="player"
        />
        <div className={styles.playerCardGrid}>
          {playerRows.map(r => {
            const name = players.find(p => p.playerId === r.player)?.name ?? r.player
            const pm = r.pm >= 0 ? `+${r.pm}` : String(r.pm)
            return (
              <div key={r.player} className={styles.playerCard}>
                <div className={styles.playerCardName}>{name}</div>
                <div className={styles.playerCardRow}>
                  <span><b>{r.PTS}</b> PTS</span>
                  <span><b>{r.REB}</b> REB</span>
                  <span><b>{r.AST}</b> AST</span>
                </div>
                <div className={styles.playerCardRow}>
                  <span><b>{r.FGM}/{r.FGA}</b> FG</span>
                  <span><b>{r.threePM}/{r.threePA}</b> 3P</span>
                  <span><b>{pm}</b> +/-</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
