import { useState, useEffect } from 'react';
import Banner from '../../components/Banner/Banner';
import ShotChartSVG from '../../components/ShotChartSVG/ShotChartSVG.jsx';
import {
  getPlayer, getPlayerScopes, getTakeaways, getGameClips, getStats, getGames,
  getPlayerGameLog, getPlayerSeasonSummary, gameLabel,
} from '../../lib/backend.js';
import {
  calculateBoxScore, calculateTeamBoxScore, calculateCareerAverages,
  calculateZoneBreakdown, calculateShotQuality, calculateShootingEfficiency,
  calculateCreation, calculateDefense, calculateLineups,
  pctText, num,
} from '../../lib/statsCore.js';
import styles from './PlayerDetailPage.module.css';

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all',        quality: '',     type: '' },
  { label: 'Good Offense', key: 'goodOffense', quality: 'good', type: 'offense' },
  { label: 'Bad Offense',  key: 'badOffense',  quality: 'bad',  type: 'offense' },
  { label: 'Good Defense', key: 'goodDefense', quality: 'good', type: 'defense' },
  { label: 'Bad Defense',  key: 'badDefense',  quality: 'bad',  type: 'defense' },
]

const TABS = ['Takeaways', 'Stats', 'Advanced', 'Clips']

export default function PlayerDetailPage({ playerId }) {
  const isTeam = playerId === 'team'
  const ADV_TABS = isTeam ? ['Shooting', 'Creation', 'Defense', 'Lineups'] : ['Shooting', 'Creation', 'Defense']

  const [player, setPlayer] = useState(null)
  const [scopes, setScopes] = useState(null)
  const [allGames, setAllGames] = useState(null)

  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const scopeType = !scope ? 'career'
    : scope.startsWith('season:') ? 'season'
    : 'game'
  const seasonVal = scopeType === 'season' ? scope.slice(7) : null
  const gameId    = scopeType === 'game'   ? scope        : null

  // Load on mount
  useEffect(() => {
    setLoading(true)
    const loads = isTeam
      ? [getGames().then(g => { setAllGames(g); return null })]
      : [
          getPlayer(playerId).then(setPlayer),
          getPlayerScopes(playerId).then(setScopes),
        ]
    Promise.all(loads)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [playerId, isTeam])

  if (loading) return <LoadingPage />
  if (error) return <ErrorPage msg={error} />

  if (isTeam) {
    return (
      <TeamDetailPage
        allGames={allGames ?? []}
        scope={scope}
        setScope={setScope}
        scopeType={scopeType}
        seasonVal={seasonVal}
        gameId={gameId}
        tab={tab}
        setTab={setTab}
        ADV_TABS={ADV_TABS}
      />
    )
  }

  if (!player) return <ErrorPage msg="Player not found." />

  return (
    <PlayerPage
      player={player}
      scopes={scopes}
      scope={scope}
      setScope={setScope}
      scopeType={scopeType}
      seasonVal={seasonVal}
      gameId={gameId}
      tab={tab}
      setTab={setTab}
      ADV_TABS={ADV_TABS}
    />
  )
}

// ── Player mode ───────────────────────────────────────────────────────────────

function PlayerPage({ player, scopes, scope, setScope, scopeType, seasonVal, gameId, tab, setTab, ADV_TABS }) {
  const initial = player.name.charAt(0).toUpperCase()

  return (
    <div className={styles.page}>
      <Banner />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBody}>
            <div className={styles.photoWrap}>
              {player.photo
                ? <img src={player.photo} alt={player.name} className={styles.photo} />
                : <div className={styles.initials}>{initial}</div>}
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>{player.name}</div>
              <div className={styles.heroMeta}>
                {player.number && <><span>#{player.number}</span><span className={styles.metaSep}>·</span></>}
                <span>{player.position}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScopeBar>
        <select
          className={styles.scopePicker}
          value={scope}
          onChange={e => setScope(e.target.value)}
        >
          <option value="">
            {scopes
              ? `All games (career) · ${scopes.career.gameCount} games · ${scopes.career.wins}–${scopes.career.losses}`
              : 'All games (career)'}
          </option>
          {(scopes?.seasons ?? []).map(s => (
            <optgroup key={s.season} label={s.season}>
              <option value={`season:${s.season}`}>
                {s.season} · Full season · {s.gameCount} games · {s.wins}–{s.losses}
              </option>
              {s.games.map(g => (
                <option key={g.id} value={g.id}>
                  {g.gameLabel} · {g.result} {g.score} · {g.opponentName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </ScopeBar>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {tab === 'Takeaways' && (
            <PlayerTakeawaysTab playerId={player.id} scope={scope} scopeType={scopeType} seasonVal={seasonVal} gameId={gameId} />
          )}
          {tab === 'Stats' && (
            <PlayerStatsTab playerId={player.id} scope={scope} scopeType={scopeType} seasonVal={seasonVal} gameId={gameId} />
          )}
          {tab === 'Advanced' && (
            <PlayerAdvancedTab playerId={player.id} scope={scope} scopeType={scopeType} seasonVal={seasonVal} gameId={gameId} ADV_TABS={ADV_TABS} />
          )}
          {tab === 'Clips' && (
            <PlayerClipsTab playerId={player.id} scopes={scopes} scope={scope} gameId={gameId} />
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerTakeawaysTab({ playerId, scope, scopeType, seasonVal, gameId }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    const filters = gameId      ? { playerId, gameId }
      : seasonVal               ? { playerId, season: seasonVal }
      : /* career */              { playerId }
    getTakeaways(filters).then(setEntries)
  }, [playerId, scope, gameId, seasonVal])

  if (!entries) return <p className={styles.placeholder}>Loading…</p>
  if (!entries.length) return <p className={styles.placeholder}>No takeaways yet.</p>

  return (
    <>
      {entries.map(entry => {
        const playerBlock = entry.players[0]
        if (!playerBlock) return null
        return (
          <div key={entry.gameId} className={styles.section}>
            {entry.game && (
              <>
                <div className={styles.sectionTitle}>
                  {gameLabel(entry.game)} — vs {entry.game.opponentName}
                </div>
                <div className={styles.sectionDate}>{entry.game.date}</div>
              </>
            )}
            <div className={styles.takeawayColumns}>
              {playerBlock.strengths?.length > 0 && (
                <div>
                  <div className={styles.takeawayLabel}>Strengths</div>
                  <ul className={`${styles.takeawayList} ${styles.takeawayGreen}`}>
                    {playerBlock.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {playerBlock.improvements?.length > 0 && (
                <div>
                  <div className={styles.takeawayLabel}>Improvements</div>
                  <ul className={`${styles.takeawayList} ${styles.takeawayRed}`}>
                    {playerBlock.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

function PlayerStatsTab({ playerId, scope, scopeType, seasonVal, gameId }) {
  const [statsData, setStatsData] = useState(null)
  const [gameLog, setGameLog] = useState(null)
  const [seasonSummary, setSeasonSummary] = useState(null)

  useEffect(() => {
    setStatsData(null)
    setGameLog(null)
    setSeasonSummary(null)

    if (scopeType === 'game') {
      getStats({ gameId }).then(setStatsData)
    } else if (scopeType === 'season') {
      Promise.all([
        getStats({ player: playerId, season: seasonVal }),
        getPlayerGameLog(playerId, seasonVal),
      ]).then(([data, log]) => { setStatsData(data); setGameLog(log) })
    } else {
      Promise.all([
        getStats({ player: playerId }),
        getPlayerSeasonSummary(playerId),
      ]).then(([data, summary]) => { setStatsData(data); setSeasonSummary(summary) })
    }
  }, [playerId, scope, scopeType, gameId, seasonVal])

  if (!statsData) return <p className={styles.placeholder}>Loading stats…</p>

  if (scopeType === 'game') {
    const rows = calculateBoxScore(statsData, playerId)
    const r = rows[0]
    if (!r) return <p className={styles.placeholder}>No stats for this game.</p>
    return (
      <div className={styles.section}>
        <BoxscoreGrid row={r} />
        <ShootingSplits row={r} />
      </div>
    )
  }

  if (scopeType === 'season') {
    const rows = calculateBoxScore(statsData, playerId)
    const r = rows[0]
    const seasonCards = r ? [
      ['PPG', r.PTS ? num(r.PTS) : 0],
      ['RPG', r.REB ? num(r.REB) : 0],
      ['APG', r.AST ? num(r.AST) : 0],
      ['FG%', pctText(r.FG_pct)],
    ] : []
    return (
      <>
        <div className={styles.section}>
          <div className={styles.statCards}>
            {seasonCards.map(([lbl, val]) => (
              <div key={lbl} className={styles.statCard}>
                <div className={styles.statCardVal}>{val}</div>
                <div className={styles.statCardLbl}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        {gameLog && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Game Log</div>
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
      <div className={styles.section}>
        <div className={styles.statCards}>
          {[['PPG', avgs.PPG], ['RPG', avgs.RPG], ['APG', avgs.APG], ['FG%', pctText(avgs.FG_pct)]].map(([lbl, val]) => (
            <div key={lbl} className={styles.statCard}>
              <div className={styles.statCardVal}>{val}</div>
              <div className={styles.statCardLbl}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
      {seasonSummary && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>By Season</div>
          <SeasonSummaryTable rows={seasonSummary} />
        </div>
      )}
    </>
  )
}

function PlayerAdvancedTab({ playerId, scope, scopeType, seasonVal, gameId, ADV_TABS }) {
  const [advTab, setAdvTab] = useState('Shooting')
  const [statsData, setStatsData] = useState(null)

  useEffect(() => {
    const filters = gameId      ? { gameId }
      : seasonVal               ? { season: seasonVal }
      : /* career */              {}
    getStats(filters).then(setStatsData)
  }, [scope, gameId, seasonVal])

  if (!statsData) return <p className={styles.placeholder}>Loading…</p>

  const scopedShots = statsData.shots.filter(s => s.player === playerId)

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
      {advTab === 'Shooting' && <PlayerShootingSubTab statsData={statsData} playerId={playerId} scopedShots={scopedShots} />}
      {advTab === 'Creation' && <PlayerCreationSubTab statsData={statsData} playerId={playerId} />}
      {advTab === 'Defense'  && <PlayerDefenseSubTab  statsData={statsData} playerId={playerId} />}
    </>
  )
}

function PlayerShootingSubTab({ statsData, playerId, scopedShots }) {
  const zones = calculateZoneBreakdown(statsData.shots, playerId)
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
            { key: 'zone',    label: 'Zone', align: 'left' },
            { key: 'fgStr',   label: 'FG' },
            { key: 'fgPct',   label: 'FG%' },
            { key: 'PTS',     label: 'PTS' },
            { key: 'freqPct', label: 'FREQ' },
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
    </>
  )
}

function PlayerCreationSubTab({ statsData, playerId }) {
  const rows = calculateCreation(statsData.events, statsData.shots, playerId)
  const r = rows[0]
  if (!r) return <p className={styles.placeholder}>No creation data.</p>
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Creation</div>
      <div className={styles.statCards}>
        {[['AST', r.AST], ['TO', r.TO], ['Pot. AST', r.Potential_AST], ['Adv', r.Adv_Created]].map(([lbl, val]) => (
          <div key={lbl} className={styles.statCard}>
            <div className={styles.statCardVal}>{val}</div>
            <div className={styles.statCardLbl}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlayerDefenseSubTab({ statsData, playerId }) {
  const rows = calculateDefense(statsData.events, playerId)
  const r = rows[0]
  if (!r) return <p className={styles.placeholder}>No defense data.</p>
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Defense</div>
      <div className={styles.statCards}>
        {[['STL', r.STL], ['BLK', r.BLK], ['DEFL', r.DEFLECTION], ['Total', r.Def_Activity]].map(([lbl, val]) => (
          <div key={lbl} className={styles.statCard}>
            <div className={styles.statCardVal}>{val}</div>
            <div className={styles.statCardLbl}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlayerClipsTab({ playerId, scopes, scope, gameId }) {
  const [clipCounts, setClipCounts] = useState({})

  useEffect(() => {
    const gId = gameId ?? scopes?.seasons?.[0]?.games?.[0]?.id
    if (!gId) return
    Promise.all(
      PLAYLISTS.map(pl =>
        getGameClips(gId, {
          quality: pl.quality || undefined,
          type: pl.type || undefined,
          player: playerId,
        }).then(r => [pl.key, r.clips.length])
      )
    ).then(pairs => setClipCounts(Object.fromEntries(pairs)))
  }, [playerId, scope, gameId, scopes])

  const gId = gameId ?? scopes?.seasons?.[0]?.games?.[0]?.id
  const clipsBase = gId ? `#/game/${gId}?player=${playerId}` : '#/'

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.clipsGrid}>
        {PLAYLISTS.map(pl => (
          <div key={pl.key} className={styles.clipCard}>
            <div className={styles.clipLabel}>{pl.label}</div>
            <div className={styles.clipCount}>{clipCounts[pl.key] ?? 0}</div>
            <div className={styles.clipMeta}>clips</div>
            <a href={clipsBase} className={styles.clipWatch}>▶ Watch</a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Team mode ─────────────────────────────────────────────────────────────────

function TeamDetailPage({ allGames, scope, setScope, scopeType, seasonVal, gameId, tab, setTab, ADV_TABS }) {
  // Group games by season for the scope picker
  const seasonMap = new Map()
  for (const g of allGames) {
    if (!seasonMap.has(g.season)) seasonMap.set(g.season, [])
    seasonMap.get(g.season).push(g)
  }
  const seasonGroups = [...seasonMap.entries()].sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div className={styles.page}>
      <Banner />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBody}>
            <div className={styles.photoWrap}>
              <div className={styles.initials}>T</div>
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>Spartans</div>
              <div className={styles.heroMeta}>Full team view</div>
            </div>
          </div>
        </div>
      </div>

      <ScopeBar>
        <select
          className={styles.scopePicker}
          value={scope}
          onChange={e => setScope(e.target.value)}
        >
          <option value="">All Games</option>
          {seasonGroups.map(([season, sGames]) => (
            <optgroup key={season} label={season}>
              <option value={`season:${season}`}>{season} · Full season</option>
              {[...sGames].sort((a, b) => b.date.localeCompare(a.date)).map(g => (
                <option key={g.id} value={g.id}>
                  {gameLabel(g)} · {g.result} {g.teamScore}–{g.opponentScore} · {g.opponentName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </ScopeBar>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {tab === 'Takeaways' && <TeamTakeawaysTab gameId={gameId} />}
          {tab === 'Stats' && <TeamStatsTab scope={scope} scopeType={scopeType} seasonVal={seasonVal} gameId={gameId} allGames={allGames} />}
          {tab === 'Advanced' && <TeamAdvancedTab scope={scope} scopeType={scopeType} seasonVal={seasonVal} gameId={gameId} ADV_TABS={ADV_TABS} />}
          {tab === 'Clips' && <TeamClipsTab gameId={gameId} allGames={allGames} />}
        </div>
      </div>
    </div>
  )
}

function TeamTakeawaysTab({ gameId }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    if (!gameId) { setEntries([]); return }
    getTakeaways({ gameId }).then(setEntries)
  }, [gameId])

  if (!gameId) return <p className={styles.placeholder}>Select a game to view team notes.</p>
  if (!entries) return <p className={styles.placeholder}>Loading…</p>
  const entry = entries[0]
  if (!entry || !entry.team?.length) return <p className={styles.placeholder}>No team notes for this game.</p>

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Team Notes</div>
      <ul className={styles.takeawayList}>
        {entry.team.map((note, i) => <li key={i}>{note}</li>)}
      </ul>
    </div>
  )
}

function TeamStatsTab({ scope, scopeType, seasonVal, gameId, allGames }) {
  const [statsData, setStatsData] = useState(null)

  useEffect(() => {
    setStatsData(null)
    const filters = gameId ? { gameId } : seasonVal ? { season: seasonVal } : {}
    getStats(filters).then(setStatsData)
  }, [scope, gameId, seasonVal])

  if (!statsData) return <p className={styles.placeholder}>Loading stats…</p>

  if (scopeType === 'game') {
    const team = calculateTeamBoxScore(statsData)
    const playerRows = calculateBoxScore(statsData)
    return (
      <>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Team</div>
          <BoxscoreGrid row={team} hidepm />
          <ShootingSplits row={team} />
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Players</div>
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
              PTS: r.PTS,
              REB: r.REB,
              AST: r.AST,
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
  // Game log table using allGames to find games in scope
  const scopedGames = allGames.filter(g => {
    if (!seasonVal && !gameId) return true
    if (seasonVal) return g.season === seasonVal
    return g.id === gameId
  })

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Team Totals</div>
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
        </div>
      </div>
      {scopedGames.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Games</div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th style={{ textAlign: 'left' }}>Game</th><th>Result</th><th>Score</th><th>Opponent</th></tr>
              </thead>
              <tbody>
                {scopedGames.map(g => (
                  <tr key={g.id}>
                    <td className={styles.tdName}><a href={`#/games/${g.id}`} style={{ color: 'inherit' }}>{gameLabel(g)}</a></td>
                    <td style={{ color: g.result === 'W' ? 'var(--green)' : 'var(--red)' }}>{g.result}</td>
                    <td>{g.teamScore}–{g.opponentScore}</td>
                    <td>{g.opponentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function TeamAdvancedTab({ scope, scopeType, seasonVal, gameId, ADV_TABS }) {
  const [advTab, setAdvTab] = useState('Shooting')
  const [statsData, setStatsData] = useState(null)
  const [allPlayers, setAllPlayers] = useState([])

  useEffect(() => {
    const filters = gameId ? { gameId } : seasonVal ? { season: seasonVal } : {}
    getStats(filters).then(setStatsData)
  }, [scope, gameId, seasonVal])

  if (!statsData) return <p className={styles.placeholder}>Loading…</p>

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
      {advTab === 'Shooting' && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Shot Chart</div>
            <ShotChartSVG shots={statsData.shots} showList={false} />
          </div>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Zone Breakdown</div>
            <StatTable
              rows={calculateZoneBreakdown(statsData.shots)}
              cols={[
                { key: 'zone',    label: 'Zone', align: 'left' },
                { key: 'fgStr',   label: 'FG' },
                { key: 'fgPct',   label: 'FG%' },
                { key: 'PTS',     label: 'PTS' },
                { key: 'freqPct', label: 'FREQ' },
              ]}
              getRow={z => ({ zone: z.zone, fgStr: `${z.FGM}/${z.FGA}`, fgPct: pctText(z.FG_pct), PTS: z.PTS, freqPct: pctText(z.freq_pct) })}
              nameKey="zone"
            />
          </div>
        </>
      )}
      {advTab === 'Creation' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Creation</div>
          <StatTable
            rows={calculateCreation(statsData.events, statsData.shots)}
            cols={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'AST', label: 'AST' },
              { key: 'TO',  label: 'TO' },
              { key: 'Pot', label: 'Pot. AST' },
              { key: 'Adv', label: 'Adv' },
            ]}
            getRow={r => ({ player: r.player, AST: r.AST, TO: r.TO, Pot: r.Potential_AST, Adv: r.Adv_Created })}
            nameKey="player"
          />
        </div>
      )}
      {advTab === 'Defense' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Defense</div>
          <StatTable
            rows={calculateDefense(statsData.events)}
            cols={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'STL', label: 'STL' },
              { key: 'BLK', label: 'BLK' },
              { key: 'DEFL', label: 'DEFL' },
              { key: 'Total', label: 'Total' },
            ]}
            getRow={r => ({ player: r.player, STL: r.STL, BLK: r.BLK, DEFL: r.DEFLECTION, Total: r.Def_Activity })}
            nameKey="player"
          />
        </div>
      )}
      {advTab === 'Lineups' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Lineups (Top 5 by Net +/-)</div>
          <StatTable
            rows={calculateLineups(statsData.lineupStints)}
            cols={[
              { key: 'lineup', label: 'Lineup', align: 'left' },
              { key: 'net',    label: 'Net +/-' },
              { key: 'stints', label: 'Stints' },
            ]}
            getRow={r => ({ lineup: r.lineup_names, net: r.net_points >= 0 ? `+${r.net_points}` : String(r.net_points), stints: r.stints })}
            nameKey="lineup"
          />
        </div>
      )}
    </>
  )
}

function TeamClipsTab({ gameId, allGames }) {
  const [clipCounts, setClipCounts] = useState({})

  useEffect(() => {
    const gId = gameId ?? allGames[0]?.id
    if (!gId) return
    Promise.all(
      PLAYLISTS.map(pl =>
        getGameClips(gId, { quality: pl.quality || undefined, type: pl.type || undefined })
          .then(r => [pl.key, r.clips.length])
      )
    ).then(pairs => setClipCounts(Object.fromEntries(pairs)))
  }, [gameId, allGames])

  const gId = gameId ?? allGames[0]?.id
  const clipsBase = gId ? `#/game/${gId}` : '#/'

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.clipsGrid}>
        {PLAYLISTS.map(pl => (
          <div key={pl.key} className={styles.clipCard}>
            <div className={styles.clipLabel}>{pl.label}</div>
            <div className={styles.clipCount}>{clipCounts[pl.key] ?? 0}</div>
            <div className={styles.clipMeta}>clips</div>
            <a href={clipsBase} className={styles.clipWatch}>▶ Watch</a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ScopeBar({ children }) {
  return (
    <div className={styles.scopeBar}>
      <div className={styles.scopeInner}>{children}</div>
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div className={styles.tabBar}>
      <div className={styles.tabInner}>
        {tabs.map(t => (
          <button
            key={t}
            className={t === active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => onChange(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoxscoreGrid({ row, hidepm = false }) {
  const cells = [
    ['PTS', row.PTS], ['REB', row.REB], ['AST', row.AST], ['STL', row.STL],
    ['BLK', row.BLK], ['TO', row.TO],
  ]
  if (!hidepm) {
    const pm = row.pm != null ? (row.pm >= 0 ? `+${row.pm}` : String(row.pm)) : '—'
    cells.push(['+/-', pm], ['MIN', '—'])
  }
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

function GameLogTable({ rows }) {
  const headers = ['Game', 'Result', 'Opp', 'PTS', 'REB', 'AST', 'FG', '3P', 'FT']
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={h === 'Game' || h === 'Opp' ? { textAlign: 'left' } : {}}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.gameId}>
              <td className={styles.tdName}>{r.gameLabel}</td>
              <td style={{ color: r.result === 'W' ? 'var(--green)' : 'var(--red)' }}>{r.result}</td>
              <td className={styles.tdName}>{r.opponentName}</td>
              <td>{r.PTS}</td>
              <td>{r.REB}</td>
              <td>{r.AST}</td>
              <td>{r.FGM}/{r.FGA}</td>
              <td>{r.threePM}/{r.threePA}</td>
              <td>{r.FTM}/{r.FTA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SeasonSummaryTable({ rows }) {
  const headers = ['Season', 'G', 'W-L', 'PPG', 'RPG', 'APG', 'FG%', '3P%', 'FT%']
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={h === 'Season' ? { textAlign: 'left' } : {}}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.season}>
              <td className={styles.tdName}>{r.season}</td>
              <td>{r.gameCount}</td>
              <td>{r.wins}–{r.losses}</td>
              <td>{r.PTS_avg}</td>
              <td>{r.REB_avg}</td>
              <td>{r.AST_avg}</td>
              <td>{pctText(r.FG_pct)}</td>
              <td>{pctText(r.threeP_pct)}</td>
              <td>{pctText(r.FT_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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

function LoadingPage() {
  return (
    <div className={styles.page}>
      <Banner />
      <p className={styles.placeholder}>Loading…</p>
    </div>
  )
}

function ErrorPage({ msg }) {
  return (
    <div className={styles.page}>
      <Banner />
      <p className={styles.placeholder}>{msg}</p>
    </div>
  )
}
