import { useState, useEffect } from 'react'
import Banner from '../../components/Banner/Banner'
import ScopeBar, { pickerClass } from '../../components/ScopeBar/ScopeBar.jsx'
import TabBar from '../../components/TabBar/TabBar.jsx'
import GameTakeawaysTab from '../../tabs/GameTakeawaysTab.jsx'
import GameStatsTab from '../../tabs/GameStatsTab.jsx'
import AdvancedTab from '../../tabs/AdvancedTab.jsx'
import ClipsTab from '../../tabs/ClipsTab.jsx'
import { getGame, getTakeaways, getGameScopes, getGameClips, getStats, gameLabel } from '../../lib/backend.js'
import styles from './GameDetailPage.module.css'

const TABS = ['Takeaways', 'Stats', 'Advanced', 'Clips']

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all',        quality: '',     type: '' },
  { label: 'Good Offense', key: 'goodOffense', quality: 'good', type: 'offense' },
  { label: 'Bad Offense',  key: 'badOffense',  quality: 'bad',  type: 'offense' },
  { label: 'Good Defense', key: 'goodDefense', quality: 'good', type: 'defense' },
  { label: 'Bad Defense',  key: 'badDefense',  quality: 'bad',  type: 'defense' },
]

export default function GameDetailPage({ gameId }) {
  const [game, setGame] = useState(null)
  const [takeawayEntry, setTakeawayEntry] = useState(null)
  const [players, setPlayers] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [clipCounts, setClipCounts] = useState({})
  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch everything in parallel on mount — no re-fetch on scope change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getGame(gameId),
      getTakeaways({ gameId }),
      getGameScopes(gameId),
      getStats({ gameId }),
      ...PLAYLISTS.map(pl =>
        getGameClips(gameId, { quality: pl.quality || undefined, type: pl.type || undefined })
          .then(r => [pl.key, r.clips.length])
      ),
    ]).then(([g, takeaways, scopes, stats, ...clipPairs]) => {
      if (cancelled) return
      setGame(g)
      setTakeawayEntry(takeaways[0] ?? null)
      setPlayers(scopes)
      setStatsData(stats)
      setClipCounts(Object.fromEntries(clipPairs))
    })
    .catch(e => { if (!cancelled) setError(e.message) })
    .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [gameId])

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
  const playlists = PLAYLISTS.map(pl => ({ label: pl.label, count: clipCounts[pl.key] ?? 0, href: clipsHref }))

  return (
    <div className={styles.page}>
      <Banner />

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

      <ScopeBar>
        <select
          className={pickerClass}
          value={scope}
          onChange={e => setScope(e.target.value)}
        >
          <option value="">All Players</option>
          {players.map(p => (
            <option key={p.playerId} value={p.playerId}>{p.name}</option>
          ))}
        </select>
      </ScopeBar>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {tab === 'Takeaways' && <GameTakeawaysTab entry={takeawayEntry} scope={scope} />}
          {tab === 'Stats'     && <GameStatsTab statsData={statsData} scope={scope} players={players} />}
          {tab === 'Advanced'  && (
            <AdvancedTab
              shots={statsData?.shots ?? null}
              events={statsData?.events ?? []}
              freeThrows={statsData?.freeThrows ?? []}
              lineupStints={statsData?.lineupStints ?? []}
              players={players}
              playerId={scope || null}
              showLineups={true}
            />
          )}
          {tab === 'Clips' && <ClipsTab playlists={playlists} />}
        </div>
      </div>
    </div>
  )
}
