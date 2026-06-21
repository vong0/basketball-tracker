import { useState, useEffect, useCallback } from 'react';
import Banner from '../../components/Banner/Banner';
import ShotChartSVG from '../../components/ShotChartSVG/ShotChartSVG.jsx';
import {
  getGame, getTakeaways, getGameScopes, getGameClips, getStats, gameLabel,
} from '../../lib/backend.js';
import {
  calculateBoxScore, calculateTeamBoxScore,
  calculateZoneBreakdown, calculateShotQuality, calculateShootingEfficiency,
  calculateCreation, calculateDefense, calculateLineups,
  pctText, num,
} from '../../lib/statsCore.js';
import styles from './GameDetailPage.module.css';

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all',        quality: '',     type: '' },
  { label: 'Good Offense', key: 'goodOffense', quality: 'good', type: 'offense' },
  { label: 'Bad Offense',  key: 'badOffense',  quality: 'bad',  type: 'offense' },
  { label: 'Good Defense', key: 'goodDefense', quality: 'good', type: 'defense' },
  { label: 'Bad Defense',  key: 'badDefense',  quality: 'bad',  type: 'defense' },
]

const TABS = ['Takeaways', 'Stats', 'Advanced', 'Clips']
const ADV_TABS = ['Shooting', 'Creation', 'Defense', 'Lineups']

export default function GameDetailPage({ gameId }) {
  const [game, setGame] = useState(null)
  const [takeawayEntry, setTakeawayEntry] = useState(null)
  const [scopeOptions, setScopeOptions] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [clipCounts, setClipCounts] = useState({})
  const [allPlayers, setAllPlayers] = useState([])
  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load game, takeaways, scope options in parallel on mount
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getGame(gameId),
      getTakeaways({ gameId }),
      getGameScopes(gameId),
    ])
      .then(([g, takeaways, scopes]) => {
        setGame(g)
        setTakeawayEntry(takeaways[0] ?? null)
        setScopeOptions(scopes)
        setAllPlayers(scopes)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [gameId])

  // Load stats when scope changes
  useEffect(() => {
    if (!game) return
    getStats({ gameId }).then(setStatsData)
  }, [game, gameId])

  // Load clip counts when game is ready
  useEffect(() => {
    if (!game) return
    Promise.all(
      PLAYLISTS.map(pl =>
        getGameClips(gameId, { quality: pl.quality || undefined, type: pl.type || undefined })
          .then(r => [pl.key, r.clips.length])
      )
    ).then(pairs => setClipCounts(Object.fromEntries(pairs)))
  }, [game, gameId])

  if (loading) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>Loading…</p>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>{error ?? 'Game not found.'}</p>
      </div>
    )
  }

  const resultClass = game.result === 'W' ? styles.badgeW : game.result === 'L' ? styles.badgeL : styles.badgeT
  const clipsHref = scope ? `#/game/${game.id}?player=${scope}` : `#/game/${game.id}`

  return (
    <div className={styles.page}>
      <Banner />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div className={styles.gameLabel}>{gameLabel(game)}</div>
            <span className={`${styles.resultBadge} ${resultClass}`}>{game.result}</span>
            {game.gloryLeagueUrl && (
              <a href={game.gloryLeagueUrl} target="_blank" rel="noopener noreferrer" className={styles.gloryLink}>
                Glory League ↗
              </a>
            )}
          </div>
          <div className={styles.scoreRow}>
            <span className={styles.score}>{game.teamScore}</span>
            <span className={styles.scoreDash}>–</span>
            <span className={styles.scoreOpp}>{game.opponentScore}</span>
          </div>
          <div className={styles.metaRow}>
            <span>vs {game.opponentName}</span>
            <span className={styles.metaSep}>·</span>
            <span>{game.date}</span>
          </div>
        </div>
      </div>

      {/* Scope picker */}
      <div className={styles.scopeBar}>
        <div className={styles.scopeInner}>
          <select
            className={styles.scopePicker}
            value={scope}
            onChange={e => setScope(e.target.value)}
          >
            <option value="">All Players</option>
            {scopeOptions.map(p => (
              <option key={p.playerId} value={p.playerId}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <div className={styles.tabInner}>
          {TABS.map(t => (
            <button
              key={t}
              className={t === tab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          {tab === 'Takeaways' && (
            <TakeawaysTab entry={takeawayEntry} scope={scope} scopeOptions={scopeOptions} />
          )}
          {tab === 'Stats' && (
            <StatsTab statsData={statsData} scope={scope} allPlayers={allPlayers} />
          )}
          {tab === 'Advanced' && (
            <AdvancedTab statsData={statsData} scope={scope} allPlayers={allPlayers} />
          )}
          {tab === 'Clips' && (
            <ClipsTab clipCounts={clipCounts} clipsHref={clipsHref} />
          )}
        </div>
      </div>
    </div>
  )
}

function TakeawaysTab({ entry, scope, scopeOptions }) {
  if (!entry) return <p className={styles.placeholder}>No takeaways for this game yet.</p>

  if (scope) {
    const scopedPlayer = entry.players.find(p => p.playerId === scope)
    if (!scopedPlayer) return <p className={styles.placeholder}>No takeaways for this player.</p>
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{scopedPlayer.name}</div>
        <PlayerTakeawayBlock player={scopedPlayer} />
      </div>
    )
  }

  return (
    <>
      {entry.team?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Team</div>
          <ul className={styles.takeawayList}>
            {entry.team.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}
      {entry.players.map(p => (
        <div key={p.playerId} className={styles.section}>
          <div className={styles.sectionTitle}>{p.name}</div>
          <PlayerTakeawayBlock player={p} />
        </div>
      ))}
    </>
  )
}

function PlayerTakeawayBlock({ player }) {
  return (
    <div className={styles.takeawayColumns}>
      {player.strengths?.length > 0 && (
        <div>
          <div className={styles.takeawayLabel}>Strengths</div>
          <ul className={`${styles.takeawayList} ${styles.takeawayGreen}`}>
            {player.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {player.improvements?.length > 0 && (
        <div>
          <div className={styles.takeawayLabel}>Improvements</div>
          <ul className={`${styles.takeawayList} ${styles.takeawayRed}`}>
            {player.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function StatsTab({ statsData, scope, allPlayers }) {
  if (!statsData) return <p className={styles.placeholder}>Loading stats…</p>

  if (scope) {
    // Single player: boxscore grid + shooting splits
    const rows = calculateBoxScore(statsData, scope)
    const r = rows[0]
    if (!r) return <p className={styles.placeholder}>No stats for this player.</p>
    const playerName = allPlayers.find(p => p.playerId === scope)?.name ?? scope
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{playerName}</div>
        <BoxscoreGrid row={r} />
        <ShootingSplits row={r} />
      </div>
    )
  }

  // All players: team totals + per-player table
  const team = calculateTeamBoxScore(statsData)
  const playerRows = calculateBoxScore(statsData)

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Team</div>
        <div className={styles.statCards}>
          {[['PTS', team.PTS], ['REB', team.REB], ['AST', team.AST], ['STL', team.STL], ['BLK', team.BLK], ['TO', team.TO]].map(([lbl, val]) => (
            <div key={lbl} className={styles.statCard}>
              <div className={styles.statCardVal}>{val}</div>
              <div className={styles.statCardLbl}>{lbl}</div>
            </div>
          ))}
        </div>
        <div className={styles.statSubRow}>
          <span className={styles.statChip}>{team.FGM}/{team.FGA} FG ({pctText(team.FG_pct)})</span>
          <span className={styles.statChip}>{team.threePM}/{team.threePA} 3P ({pctText(team.threeP_pct)})</span>
          <span className={styles.statChip}>{team.FTM}/{team.FTA} FT ({pctText(team.FT_pct)})</span>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Players</div>
        <PlayerStatsTable rows={playerRows} allPlayers={allPlayers} />
      </div>
    </>
  )
}

function BoxscoreGrid({ row }) {
  const cells = [
    ['PTS', row.PTS], ['REB', row.REB], ['AST', row.AST], ['STL', row.STL],
    ['BLK', row.BLK], ['TO', row.TO], ['+/-', row.pm >= 0 ? `+${row.pm}` : row.pm], ['MIN', '—'],
  ]
  return (
    <div className={styles.boxscoreGrid}>
      {cells.map(([lbl, val]) => (
        <div key={lbl} className={styles.boxscoreCell}>
          <div className={styles.statCardVal}>{val}</div>
          <div className={styles.statCardLbl}>{lbl}</div>
        </div>
      ))}
    </div>
  )
}

function ShootingSplits({ row }) {
  return (
    <div className={styles.statSubRow} style={{ marginTop: 12 }}>
      <span className={styles.statChip}>{row.FGM}/{row.FGA} FG ({pctText(row.FG_pct)})</span>
      <span className={styles.statChip}>{row.threePM}/{row.threePA} 3P ({pctText(row.threeP_pct)})</span>
      <span className={styles.statChip}>{row.FTM}/{row.FTA} FT ({pctText(row.FT_pct)})</span>
    </div>
  )
}

function PlayerStatsTable({ rows, allPlayers }) {
  const headers = ['Player', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', '+/-', 'FG', '3P', 'FT']
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const info = allPlayers.find(p => p.playerId === r.player)
              const name = info?.name ?? r.player
              const pm = r.pm >= 0 ? `+${r.pm}` : String(r.pm)
              return (
                <tr key={r.player}>
                  <td className={styles.tdName}>{name}</td>
                  <td>{r.PTS}</td>
                  <td>{r.REB}</td>
                  <td>{r.AST}</td>
                  <td>{r.STL}</td>
                  <td>{r.BLK}</td>
                  <td>{r.TO}</td>
                  <td>{pm}</td>
                  <td>{r.FGM}/{r.FGA}</td>
                  <td>{r.threePM}/{r.threePA}</td>
                  <td>{r.FTM}/{r.FTA}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.playerStatCardGrid}>
        {rows.map(r => {
          const info = allPlayers.find(p => p.playerId === r.player)
          const name = info?.name ?? r.player
          const pm = r.pm >= 0 ? `+${r.pm}` : String(r.pm)
          return (
            <div key={r.player} className={styles.playerStatCard}>
              <div className={styles.playerStatName}>{name}</div>
              <div className={styles.playerStatRow}>
                <span><b>{r.PTS}</b> PTS</span>
                <span><b>{r.REB}</b> REB</span>
                <span><b>{r.AST}</b> AST</span>
              </div>
              <div className={styles.playerStatRow}>
                <span><b>{r.FGM}/{r.FGA}</b> FG</span>
                <span><b>{r.threePM}/{r.threePA}</b> 3P</span>
                <span><b>{pm}</b> +/-</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function AdvancedTab({ statsData, scope, allPlayers }) {
  const [advTab, setAdvTab] = useState('Shooting')

  if (!statsData) return <p className={styles.placeholder}>Loading…</p>

  const scopedShots = scope ? statsData.shots.filter(s => s.player === scope) : statsData.shots

  return (
    <>
      <div className={styles.advSubTabs}>
        {ADV_TABS.map(t => (
          <button
            key={t}
            className={t === advTab ? `${styles.advTab} ${styles.advTabActive}` : styles.advTab}
            onClick={() => setAdvTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {advTab === 'Shooting' && <ShootingSubTab statsData={statsData} scope={scope} scopedShots={scopedShots} allPlayers={allPlayers} />}
      {advTab === 'Creation' && <CreationSubTab statsData={statsData} scope={scope} allPlayers={allPlayers} />}
      {advTab === 'Defense'  && <DefenseSubTab  statsData={statsData} scope={scope} allPlayers={allPlayers} />}
      {advTab === 'Lineups'  && <LineupsSubTab  statsData={statsData} allPlayers={allPlayers} />}
    </>
  )
}

function ShootingSubTab({ statsData, scope, scopedShots, allPlayers }) {
  const zones = calculateZoneBreakdown(statsData.shots, scope || null)
  const efficiency = calculateShootingEfficiency(statsData.shots, statsData.freeThrows, scope || null)

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Shot Chart</div>
        <ShotChartSVG shots={scopedShots} showList={true} />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Zone Breakdown</div>
        <StatTable
          rows={zones}
          cols={[
            { key: 'zone',     label: 'Zone',  align: 'left' },
            { key: 'fgStr',    label: 'FG' },
            { key: 'fgPct',    label: 'FG%' },
            { key: 'PTS',      label: 'PTS' },
            { key: 'freqPct',  label: 'FREQ' },
          ]}
          getRow={z => ({
            zone: z.zone,
            fgStr: `${z.FGM}/${z.FGA}`,
            fgPct: pctText(z.FG_pct),
            PTS: z.PTS,
            freqPct: pctText(z.freq_pct),
          })}
          nameKey="zone"
        />
      </div>
      {!scope && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Shooting Efficiency</div>
          <StatTable
            rows={efficiency}
            cols={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'eFG',    label: 'eFG%' },
              { key: 'TS',     label: 'TS%' },
            ]}
            getRow={r => ({
              player: allPlayers.find(p => p.playerId === r.player)?.name ?? r.player,
              eFG: pctText(r.eFG_pct),
              TS: pctText(r.TS_pct),
            })}
            nameKey="player"
          />
        </div>
      )}
    </>
  )
}

function CreationSubTab({ statsData, scope, allPlayers }) {
  const rows = calculateCreation(statsData.events, statsData.shots, scope || null)
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Creation</div>
      <StatTable
        rows={rows}
        cols={[
          { key: 'player',       label: 'Player',         align: 'left' },
          { key: 'AST',          label: 'AST' },
          { key: 'TO',           label: 'TO' },
          { key: 'Potential_AST', label: 'Pot. AST' },
          { key: 'Adv_Created',  label: 'Adv. Created' },
        ]}
        getRow={r => ({
          player: allPlayers.find(p => p.playerId === r.player)?.name ?? r.player,
          AST: r.AST,
          TO: r.TO,
          Potential_AST: r.Potential_AST,
          Adv_Created: r.Adv_Created,
        })}
        nameKey="player"
      />
    </div>
  )
}

function DefenseSubTab({ statsData, scope, allPlayers }) {
  const rows = calculateDefense(statsData.events, scope || null)
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Defense</div>
      <StatTable
        rows={rows}
        cols={[
          { key: 'player',      label: 'Player',  align: 'left' },
          { key: 'STL',         label: 'STL' },
          { key: 'BLK',         label: 'BLK' },
          { key: 'DEFLECTION',  label: 'DEFL' },
          { key: 'Charges',     label: 'Charges' },
          { key: 'Total',       label: 'Total' },
        ]}
        getRow={r => ({
          player: allPlayers.find(p => p.playerId === r.player)?.name ?? r.player,
          STL: r.STL,
          BLK: r.BLK,
          DEFLECTION: r.DEFLECTION,
          Charges: r.Charges_Drawn,
          Total: r.Def_Activity,
        })}
        nameKey="player"
      />
    </div>
  )
}

function LineupsSubTab({ statsData, allPlayers }) {
  const rows = calculateLineups(statsData.lineupStints, allPlayers.map(p => ({ id: p.playerId, name: p.name })))
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Lineups (Top 5 by Net +/-)</div>
      <StatTable
        rows={rows}
        cols={[
          { key: 'lineup_names', label: 'Lineup',   align: 'left' },
          { key: 'net_points',   label: 'Net +/-' },
          { key: 'stints',       label: 'Stints' },
        ]}
        getRow={r => ({
          lineup_names: r.lineup_names,
          net_points: r.net_points >= 0 ? `+${r.net_points}` : String(r.net_points),
          stints: r.stints,
        })}
        nameKey="lineup_names"
      />
    </div>
  )
}

// Responsive table/card grid: table on desktop, cards on mobile (CSS-only).
function StatTable({ rows, cols, getRow, nameKey }) {
  if (!rows.length) return <p className={styles.placeholder}>No data.</p>
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{cols.map(c => <th key={c.key} style={c.align === 'left' ? { textAlign: 'left' } : {}}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const cells = getRow(row)
              return (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c.key} className={c.align === 'left' ? styles.tdName : undefined}>
                      {cells[c.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.statCardMobileGrid}>
        {rows.map((row, i) => {
          const cells = getRow(row)
          return (
            <div key={i} className={styles.statCardMobile}>
              <div className={styles.statCardMobileName}>{cells[nameKey]}</div>
              {cols.filter(c => c.key !== nameKey).map(c => (
                <div key={c.key} className={styles.statCardMobileRow}>
                  <span className={styles.statCardMobileLbl}>{c.label}</span>
                  <span className={styles.statCardMobileVal}>{cells[c.key]}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

function ClipsTab({ clipCounts, clipsHref }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.clipsGrid}>
        {PLAYLISTS.map(pl => (
          <div key={pl.key} className={styles.clipCard}>
            <div className={styles.clipLabel}>{pl.label}</div>
            <div className={styles.clipCount}>{clipCounts[pl.key] ?? 0}</div>
            <div className={styles.clipMeta}>clips</div>
            <a href={clipsHref} className={styles.clipWatch}>▶ Watch</a>
          </div>
        ))}
      </div>
    </div>
  )
}
