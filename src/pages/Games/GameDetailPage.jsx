import { useState } from 'react';
import Banner from '../../components/Banner/Banner';
import { mockGames, mockTakeaways, mockPlayers, mockClipCounts, mockStats, mockZones, gameLabel } from '../../lib/mockData.js';
import styles from './GameDetailPage.module.css';

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all',        filter: '' },
  { label: 'Good Offense', key: 'goodOffense', filter: 'good-offense' },
  { label: 'Bad Offense',  key: 'badOffense',  filter: 'bad-offense' },
  { label: 'Good Defense', key: 'goodDefense', filter: 'good-defense' },
  { label: 'Bad Defense',  key: 'badDefense',  filter: 'bad-defense' },
]

const TABS = ['Takeaways', 'Stats', 'Advanced', 'Clips']

export default function GameDetailPage({ gameId }) {
  const game = mockGames.find(g => g.id === gameId)
  const takeaways = mockTakeaways.find(t => t.gameId === gameId)
  const clipCounts = mockClipCounts[gameId] ?? {}
  const stats = mockStats[gameId]
  const zones = mockZones[gameId] ?? []

  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')

  if (!game) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>Game not found.</p>
      </div>
    )
  }

  const resultClass = game.result === 'W' ? styles.badgeW : game.result === 'L' ? styles.badgeL : styles.badgeT
  const scopePlayers = takeaways?.players ?? []
  const scopedPlayer = scopePlayers.find(p => p.playerId === scope)
  const scopedPlayerInfo = mockPlayers.find(p => p.id === scope)

  const clipsBase = `#/game/${game.id}`

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
          <div className={styles.halvesRow}>
            <span className={styles.halfLabel}>H1</span>
            <span className={styles.halfScore}>{game.halves.h1.team}–{game.halves.h1.opponent}</span>
            <span className={styles.halfSep}>·</span>
            <span className={styles.halfLabel}>H2</span>
            <span className={styles.halfScore}>{game.halves.h2.team}–{game.halves.h2.opponent}</span>
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
            {scopePlayers.map(p => {
              const info = mockPlayers.find(pl => pl.id === p.playerId)
              return (
                <option key={p.playerId} value={p.playerId}>
                  {info?.name ?? p.playerId}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Tabs */}
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
            <TakeawaysTab takeaways={takeaways} scope={scope} scopedPlayer={scopedPlayer} scopedPlayerInfo={scopedPlayerInfo} allPlayers={mockPlayers} />
          )}
          {tab === 'Stats' && (
            <StatsTab stats={stats} allPlayers={mockPlayers} />
          )}
          {tab === 'Advanced' && (
            <AdvancedTab zones={zones} />
          )}
          {tab === 'Clips' && (
            <ClipsTab clipCounts={clipCounts} clipsBase={clipsBase} scope={scope} />
          )}
        </div>
      </div>
    </div>
  )
}

function TakeawaysTab({ takeaways, scope, scopedPlayer, scopedPlayerInfo, allPlayers }) {
  if (!takeaways) return <p className={styles.placeholder}>No takeaways for this game yet.</p>

  if (scope && scopedPlayer) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{scopedPlayerInfo?.name ?? scope}</div>
        <PlayerTakeawayBlock player={scopedPlayer} />
      </div>
    )
  }

  return (
    <>
      {takeaways.team?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Team</div>
          <ul className={styles.takeawayList}>
            {takeaways.team.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}
      {takeaways.players.map(p => {
        const info = allPlayers.find(pl => pl.id === p.playerId)
        return (
          <div key={p.playerId} className={styles.section}>
            <div className={styles.sectionTitle}>{info?.name ?? p.playerId}</div>
            <PlayerTakeawayBlock player={p} />
          </div>
        )
      })}
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

function StatsTab({ stats, allPlayers }) {
  if (!stats) return <p className={styles.placeholder}>No stats available.</p>

  const playerIds = Object.keys(stats.players)
  const cols = ['pts', 'reb', 'ast', 'stl', 'blk', 'to', 'pm', 'fg', 'threes', 'ft']
  const headers = ['Player', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', '+/-', 'FG', '3P', 'FT']

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Team</div>
        <div className={styles.statCards}>
          {['pts','reb','ast','stl','blk','to'].map(k => (
            <div key={k} className={styles.statCard}>
              <div className={styles.statCardVal}>{stats.team[k]}</div>
              <div className={styles.statCardLbl}>{k.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className={styles.statSubRow}>
          <span className={styles.statChip}>{stats.team.fg} FG</span>
          <span className={styles.statChip}>{stats.team.threes} 3P</span>
          <span className={styles.statChip}>{stats.team.ft} FT</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Players</div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {playerIds.map(pid => {
                const p = stats.players[pid]
                const info = allPlayers.find(pl => pl.id === pid)
                return (
                  <tr key={pid}>
                    <td className={styles.tdName}>{info?.name ?? pid}</td>
                    {cols.map(c => <td key={c}>{p[c] ?? '—'}</td>)}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile stat cards */}
        <div className={styles.playerStatCardGrid}>
          {playerIds.map(pid => {
            const p = stats.players[pid]
            const info = allPlayers.find(pl => pl.id === pid)
            return (
              <div key={pid} className={styles.playerStatCard}>
                <div className={styles.playerStatName}>{info?.name ?? pid}</div>
                <div className={styles.playerStatRow}>
                  <span><b>{p.pts}</b> PTS</span>
                  <span><b>{p.reb}</b> REB</span>
                  <span><b>{p.ast}</b> AST</span>
                </div>
                <div className={styles.playerStatRow}>
                  <span><b>{p.fg}</b> FG</span>
                  <span><b>{p.threes}</b> 3P</span>
                  <span><b>{p.pm}</b> +/-</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function AdvancedTab({ zones }) {
  if (!zones.length) return <p className={styles.placeholder}>No advanced data available.</p>

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Shot Zones</div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Zone</th><th>FG</th><th>PCT</th><th>PTS</th><th>FREQ</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(z => (
              <tr key={z.zone}>
                <td className={styles.tdName}>{z.zone}</td>
                <td>{z.fg}</td>
                <td>{z.pct}</td>
                <td>{z.pts}</td>
                <td>{z.freq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile zone cards */}
      <div className={styles.zoneCardGrid}>
        {zones.map(z => (
          <div key={z.zone} className={styles.zoneCard}>
            <div className={styles.zoneName}>{z.zone}</div>
            <div className={styles.zoneFg}>{z.fg}</div>
            <div className={styles.zonePct}>{z.pct}</div>
            <div className={styles.zoneMeta}>{z.pts} pts · {z.freq}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClipsTab({ clipCounts, clipsBase, scope }) {
  const suffix = scope ? `?player=${scope}` : ''
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.clipsGrid}>
        {PLAYLISTS.map(pl => {
          const count = clipCounts[pl.key] ?? 0
          const href = `${clipsBase}${suffix}`
          return (
            <div key={pl.key} className={styles.clipCard}>
              <div className={styles.clipLabel}>{pl.label}</div>
              <div className={styles.clipCount}>{count}</div>
              <div className={styles.clipMeta}>clips</div>
              <a href={href} className={styles.clipWatch}>▶ Watch</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
