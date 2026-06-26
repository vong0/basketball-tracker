import { useState, useEffect } from 'react'
import Banner from '../../components/Banner/Banner'
import ScopeBar, { pickerClass } from '../../components/ScopeBar/ScopeBar.jsx'
import TabBar from '../../components/TabBar/TabBar.jsx'
import Takeaways from './views/Takeaways.jsx'
import BoxScore from './views/BoxScore.jsx'
import Clips from './views/Clips.jsx'
import Advanced from './views/Advanced.jsx'
import {
  getPlayer, getPlayerScopes, getTakeaways, getGameClips, getStats, getGames,
} from '../../lib/backend.js'
import styles from './PlayerDetailPage.module.css'

const TABS = ['Takeaways', 'Box Score', 'Clips', 'Advanced']

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all',        quality: '',     type: '' },
  { label: 'Good Offense', key: 'goodOffense', quality: 'good', type: 'offense' },
  { label: 'Bad Offense',  key: 'badOffense',  quality: 'bad',  type: 'offense' },
  { label: 'Good Defense', key: 'goodDefense', quality: 'good', type: 'defense' },
  { label: 'Bad Defense',  key: 'badDefense',  quality: 'bad',  type: 'defense' },
]

export default function PlayerDetailPage({ playerId }) {
  const [player, setPlayer] = useState(null)
  const [scopes, setScopes] = useState(null)
  const [games, setGames] = useState([])

  const [statsData, setStatsData] = useState(null)
  const [takeawayEntries, setTakeawayEntries] = useState(null)
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

  // Load player + scopes + games on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getPlayer(playerId), getPlayerScopes(playerId), getGames()])
      .then(([p, s, g]) => { if (!cancelled) { setPlayer(p); setScopes(s); setGames(g) } })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [playerId])

  // Load tab data together when scope changes (after player+scopes ready)
  useEffect(() => {
    if (!player || !scopes) return

    let cancelled = false
    setStatsData(null)
    setTakeawayEntries(null)
    setClipCounts({})

    const statsFilters = scopeType === 'game'   ? { gameId }
      : scopeType === 'season' ? { player: playerId, season: seasonVal }
      : { player: playerId }

    const takeawayFilters = scopeType === 'game'   ? { playerId, gameId }
      : scopeType === 'season' ? { playerId, season: seasonVal }
      : { playerId }

    getStats(statsFilters).then(d => { if (!cancelled) setStatsData(d) })
    getTakeaways(takeawayFilters).then(e => { if (!cancelled) setTakeawayEntries(e) })

    const clipGid = gameId ?? scopes.seasons?.[0]?.games?.[0]?.id
    if (clipGid) {
      Promise.all(PLAYLISTS.map(pl =>
        getGameClips(clipGid, { quality: pl.quality || undefined, type: pl.type || undefined, player: playerId })
          .then(r => [pl.key, r.clips.length])
      )).then(pairs => { if (!cancelled) setClipCounts(Object.fromEntries(pairs)) })
    }

    return () => { cancelled = true }
  }, [player, scopes, scope])

  if (loading) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>Loading…</p>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>{error ?? 'Player not found.'}</p>
      </div>
    )
  }

  const clipGid = gameId ?? scopes?.seasons?.[0]?.games?.[0]?.id
  const clipsBase = clipGid ? `#/game/${clipGid}?player=${playerId}` : '#/'
  const playlists = PLAYLISTS.map(pl => ({ label: pl.label, count: clipCounts[pl.key] ?? 0, href: clipsBase }))

  return (
    <div className={styles.page}>
      <Banner />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBody}>
            <div className={styles.photoWrap}>
              {player.photo
                ? <img src={player.photo} alt={player.name} className={styles.photo} />
                : <div className={styles.initials}>{player.name.charAt(0).toUpperCase()}</div>}
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
          className={pickerClass}
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
          {tab === 'Takeaways' && <Takeaways entries={takeawayEntries} />}
          {tab === 'Box Score' && <BoxScore statsData={statsData} playerId={playerId} scopeType={scopeType} games={games} />}
          {tab === 'Clips'     && <Clips playlists={playlists} />}
          {tab === 'Advanced'  && statsData && <Advanced statsData={statsData} playerId={playerId} />}
        </div>
      </div>
    </div>
  )
}
