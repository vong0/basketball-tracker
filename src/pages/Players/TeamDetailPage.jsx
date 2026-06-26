import { useState, useEffect, useMemo } from 'react'
import Banner from '../../components/Banner/Banner'
import ScopeBar, { pickerClass } from '../../components/ScopeBar/ScopeBar.jsx'
import TabBar from '../../components/TabBar/TabBar.jsx'
import Overview from '../Games/views/Overview.jsx'
import BoxScore from '../Games/views/BoxScore.jsx'
import StatLeaders from '../Games/views/StatLeaders.jsx'
import TeamSummary from '../Games/views/TeamSummary.jsx'
import Takeaways from '../Games/views/Takeaways.jsx'
import ShotChart from '../Games/views/ShotChart.jsx'
import AdvancedStats from '../Games/views/AdvancedStats.jsx'
import { getGames, getPlayers, getTakeaways, getStats, gameLabel } from '../../lib/backend.js'
import styles from './TeamDetailPage.module.css'

const TABS = ['Overview', 'Box Score', 'Stat Leaders', 'Team Summary', 'Takeaways', 'Shot Chart', 'Advanced Stats']
const TAB_IDS = TABS.map(t => t.toLowerCase().replace(/\s+/g, '-'))

export default function TeamDetailPage() {
  const [allGames, setAllGames] = useState(null)
  const [players, setPlayers] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [takeawayEntry, setTakeawayEntry] = useState(null)

  const [scope, setScope] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const scopeType = !scope ? 'career'
    : scope.startsWith('season:') ? 'season'
    : 'game'
  const seasonVal = scopeType === 'season' ? scope.slice(7) : null
  const gameId    = scopeType === 'game'   ? scope           : null

  // Load all games + roster on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getGames(), getPlayers({ active: false })])
      .then(([g, p]) => {
        if (cancelled) return
        setAllGames(g)
        setPlayers(p.map(pl => ({ playerId: pl.id, name: pl.name })))
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load tab data when scope changes
  useEffect(() => {
    if (!allGames) return
    let cancelled = false
    setStatsData(null)
    setTakeawayEntry(null)

    const filters = gameId ? { gameId } : seasonVal ? { season: seasonVal } : {}
    getStats(filters).then(d => { if (!cancelled) setStatsData(d) })
    if (gameId) {
      getTakeaways({ gameId }).then(entries => { if (!cancelled) setTakeawayEntry(entries[0] ?? null) })
    }
    return () => { cancelled = true }
  }, [allGames, scope])

  useEffect(() => {
    if (!statsData) return
    const sections = TAB_IDS.map(id => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length) setActiveTab(TABS[TAB_IDS.indexOf(visible[0].target.id)])
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [statsData])

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

  const seasonMap = new Map()
  for (const g of (allGames ?? [])) {
    if (!seasonMap.has(g.season)) seasonMap.set(g.season, [])
    seasonMap.get(g.season).push(g)
  }
  const seasonGroups = [...seasonMap.entries()].sort((a, b) => b[0].localeCompare(a[0]))

  function renderView(id) {
    switch (id) {
      case 'overview':       return <Overview statsData={statsData} players={players} />
      case 'box-score':      return <BoxScore statsData={statsData} players={players} />
      case 'stat-leaders':   return <StatLeaders statsData={statsData} players={players} />
      case 'team-summary':   return <TeamSummary statsData={statsData} />
      case 'takeaways':      return gameId
        ? <Takeaways entry={takeawayEntry} />
        : <p className={styles.placeholder}>Select a specific game to view takeaways.</p>
      case 'shot-chart':     return <ShotChart statsData={statsData} />
      case 'advanced-stats': return <AdvancedStats statsData={statsData} />
      default: return null
    }
  }

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

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} scrollMode={true} />

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {statsData && TAB_IDS.map(id => (
            <section key={id} id={id}>
              {renderView(id)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
