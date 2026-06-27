import { useState, useEffect } from 'react'
import Banner from '../../components/Banner/Banner'
import ScopeBar, { pickerClass } from '../../components/ScopeBar/ScopeBar.jsx'
import TabBar from '../../components/TabBar/TabBar.jsx'
import Takeaways from './views/Takeaways.jsx'
import BoxScore from './views/BoxScore.jsx'
import Clips from './views/Clips.jsx'
import Advanced from './views/Advanced.jsx'
import ShotChart from './views/ShotChart.jsx'
import {
  getPlayer, getPlayerScopes, getTakeaways, getClips, getStats, getGames,
} from '../../lib/backend.js'
import styles from './PlayerDetailPage.module.css'

const TABS = ['Playlists', 'Takeaways', 'Box Score', 'Shot Chart', 'Advanced Stats']

function scopeToClipScope(scope) {
  if (!scope) return {}
  if (scope.startsWith('season:')) return { season: scope.slice(7) }
  return { gameId: scope }
}

export default function PlayerDetailPage({ playerId, isMobile }) {
  const [player, setPlayer] = useState(null)
  const [scopes, setScopes] = useState(null)
  const [games, setGames] = useState([])

  const [statsData, setStatsData] = useState(null)
  const [takeawayEntries, setTakeawayEntries] = useState(null)

  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Clips tab: lazy-loaded per scope
  const [clipsData, setClipsData] = useState(null)
  const [clipsLoading, setClipsLoading] = useState(false)

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

  // Load stats + takeaways when scope changes
  useEffect(() => {
    if (!player || !scopes) return

    let cancelled = false
    setStatsData(null)
    setTakeawayEntries(null)

    const statsFilters = scopeType === 'game'   ? { gameId }
      : scopeType === 'season' ? { player: playerId, season: seasonVal }
      : { player: playerId }

    const takeawayFilters = scopeType === 'game'   ? { playerId, gameId }
      : scopeType === 'season' ? { playerId, season: seasonVal }
      : { playerId }

    getStats(statsFilters).then(d => { if (!cancelled) setStatsData(d) })
    getTakeaways(takeawayFilters).then(e => { if (!cancelled) setTakeawayEntries(e) })

    return () => { cancelled = true }
  }, [player, scopes, scope]) // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate clips when scope changes
  useEffect(() => {
    setClipsData(null)
  }, [scope])

  // Lazy-load clips when Playlists tab is active
  useEffect(() => {
    if (tab !== 'Playlists' || clipsData || clipsLoading) return
    setClipsLoading(true)
    getClips(scopeToClipScope(scope))
      .then(result => setClipsData(result))
      .catch(e => console.error('Could not load clips:', e))
      .finally(() => setClipsLoading(false))
  }, [tab, clipsData, clipsLoading, scope])

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
          {tab === 'Playlists'      && (
            <Clips
              allClips={clipsData?.clips ?? null}
              player={player}
              playerId={playerId}
              isMobile={isMobile}
              loading={clipsLoading}
            />
          )}
          {tab === 'Takeaways'      && <Takeaways entries={takeawayEntries} />}
          {tab === 'Box Score'      && <BoxScore statsData={statsData} playerId={playerId} scopeType={scopeType} games={games} />}
          {tab === 'Shot Chart'     && statsData && <ShotChart statsData={statsData} playerId={playerId} />}
          {tab === 'Advanced Stats' && statsData && <Advanced statsData={statsData} playerId={playerId} />}
        </div>
      </div>
    </div>
  )
}
