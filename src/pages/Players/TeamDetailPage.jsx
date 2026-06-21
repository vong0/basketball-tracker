import { useState, useEffect } from 'react'
import Banner from '../../components/Banner/Banner'
import ScopeBar, { pickerClass } from '../../components/ScopeBar/ScopeBar.jsx'
import TabBar from '../../components/TabBar/TabBar.jsx'
import GameTakeawaysTab from '../../tabs/GameTakeawaysTab.jsx'
import TeamStatsTab from '../../tabs/TeamStatsTab.jsx'
import AdvancedTab from '../../tabs/AdvancedTab.jsx'
import ClipsTab from '../../tabs/ClipsTab.jsx'
import { getGames, getTakeaways, getGameClips, getStats, gameLabel } from '../../lib/backend.js'
import styles from './TeamDetailPage.module.css'

const TABS = ['Takeaways', 'Stats', 'Advanced', 'Clips']

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all',        quality: '',     type: '' },
  { label: 'Good Offense', key: 'goodOffense', quality: 'good', type: 'offense' },
  { label: 'Bad Offense',  key: 'badOffense',  quality: 'bad',  type: 'offense' },
  { label: 'Good Defense', key: 'goodDefense', quality: 'good', type: 'defense' },
  { label: 'Bad Defense',  key: 'badDefense',  quality: 'bad',  type: 'defense' },
]

export default function TeamDetailPage() {
  const [allGames, setAllGames] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [takeawayEntry, setTakeawayEntry] = useState(null)
  const [clipCounts, setClipCounts] = useState({})

  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const scopeType = !scope ? 'career'
    : scope.startsWith('season:') ? 'season'
    : 'game'
  const seasonVal = scopeType === 'season' ? scope.slice(7) : null
  const gameId    = scopeType === 'game'   ? scope           : null

  // Load all games on mount (for the scope picker)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getGames()
      .then(g => { if (!cancelled) setAllGames(g) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load tab data when scope changes (after allGames is ready)
  useEffect(() => {
    if (!allGames) return

    let cancelled = false
    setStatsData(null)
    setTakeawayEntry(null)
    setClipCounts({})

    const filters = gameId ? { gameId } : seasonVal ? { season: seasonVal } : {}

    getStats(filters).then(d => { if (!cancelled) setStatsData(d) })

    if (gameId) {
      getTakeaways({ gameId }).then(entries => { if (!cancelled) setTakeawayEntry(entries[0] ?? null) })
    }

    const clipGid = gameId ?? allGames[0]?.id
    if (clipGid) {
      Promise.all(PLAYLISTS.map(pl =>
        getGameClips(clipGid, { quality: pl.quality || undefined, type: pl.type || undefined })
          .then(r => [pl.key, r.clips.length])
      )).then(pairs => { if (!cancelled) setClipCounts(Object.fromEntries(pairs)) })
    }

    return () => { cancelled = true }
  }, [allGames, scope])

  if (loading) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>{error}</p>
      </div>
    )
  }

  // Build season groups for scope picker
  const seasonMap = new Map()
  for (const g of (allGames ?? [])) {
    if (!seasonMap.has(g.season)) seasonMap.set(g.season, [])
    seasonMap.get(g.season).push(g)
  }
  const seasonGroups = [...seasonMap.entries()].sort((a, b) => b[0].localeCompare(a[0]))

  const clipGid = gameId ?? allGames?.[0]?.id
  const clipsHref = clipGid ? `#/game/${clipGid}` : '#/'
  const playlists = PLAYLISTS.map(pl => ({ label: pl.label, count: clipCounts[pl.key] ?? 0, href: clipsHref }))

  return (
    <div className={styles.page}>
      <Banner />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBody}>
            <div className={styles.avatar}>T</div>
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>Spartans</div>
              <div className={styles.heroMeta}>Full team view</div>
            </div>
          </div>
        </div>
      </div>

      <ScopeBar>
        <select
          className={pickerClass}
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
          {tab === 'Takeaways' && (
            gameId
              ? <GameTakeawaysTab entry={takeawayEntry} scope="" />
              : <p className={styles.placeholder}>Select a specific game to view takeaways.</p>
          )}
          {tab === 'Stats' && (
            <TeamStatsTab
              statsData={statsData}
              scopeType={scopeType}
              seasonVal={seasonVal}
              gameId={gameId}
              allGames={allGames}
            />
          )}
          {tab === 'Advanced' && (
            <AdvancedTab
              shots={statsData?.shots ?? null}
              events={statsData?.events ?? []}
              freeThrows={statsData?.freeThrows ?? []}
              lineupStints={statsData?.lineupStints ?? []}
              players={[]}
              playerId={null}
              showLineups={true}
            />
          )}
          {tab === 'Clips' && <ClipsTab playlists={playlists} />}
        </div>
      </div>
    </div>
  )
}
