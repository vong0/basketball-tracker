import { useState, useEffect, useMemo } from 'react'
import Banner from '../../components/Banner/Banner'
import ScopeBar, { pickerClass } from '../../components/ScopeBar/ScopeBar.jsx'
import TabBar from '../../components/TabBar/TabBar.jsx'
import Overview from './views/Overview.jsx'
import BoxScore from './views/BoxScore.jsx'
import StatLeaders from './views/StatLeaders.jsx'
import TeamSummary from './views/TeamSummary.jsx'
import Takeaways from './views/Takeaways.jsx'
import ShotChart from './views/ShotChart.jsx'
import AdvancedStats from './views/AdvancedStats.jsx'
import { getGame, getTakeaways, getGameScopes, getStats, gameLabel } from '../../lib/backend.js'
import { filterStats } from '../../lib/statsCore.js'
import styles from './GameDetailPage.module.css'

const TABS = ['Overview', 'Box Score', 'Stat Leaders', 'Team Summary', 'Takeaways', 'Shot Chart', 'Advanced Stats']
const TAB_IDS = TABS.map(t => t.toLowerCase().replace(/\s+/g, '-'))

export default function GameDetailPage({ gameId }) {
  const [game, setGame] = useState(null)
  const [takeawayEntry, setTakeawayEntry] = useState(null)
  const [players, setPlayers] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [half, setHalf] = useState('ALL')
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getGame(gameId),
      getTakeaways({ gameId }),
      getGameScopes(gameId),
      getStats({ gameId }),
    ]).then(([g, takeaways, scopes, stats]) => {
      if (cancelled) return
      setGame(g)
      setTakeawayEntry(takeaways[0] ?? null)
      setPlayers(scopes)
      setStatsData(stats)
    })
    .catch(e => { if (!cancelled) setError(e.message) })
    .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [gameId])

  const filteredStats = useMemo(() => {
    if (!statsData) return null
    return half === 'ALL' ? statsData : filterStats(statsData, { half })
  }, [statsData, half])

  useEffect(() => {
    if (!filteredStats) return
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
  }, [filteredStats])

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

  function renderView(id) {
    switch (id) {
      case 'overview':       return <Overview statsData={filteredStats} players={players} />
      case 'box-score':      return <BoxScore statsData={filteredStats} players={players} />
      case 'stat-leaders':   return <StatLeaders statsData={filteredStats} players={players} />
      case 'team-summary':   return <TeamSummary statsData={filteredStats} />
      case 'takeaways':      return <Takeaways entry={takeawayEntry} />
      case 'shot-chart':     return <ShotChart statsData={filteredStats} />
      case 'advanced-stats': return <AdvancedStats statsData={filteredStats} />
      default: return null
    }
  }

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
        <select className={pickerClass} value={half} onChange={e => setHalf(e.target.value)}>
          <option value="ALL">All halves</option>
          <option value="1H">1st Half</option>
          <option value="2H">2nd Half</option>
        </select>
      </ScopeBar>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} scrollMode={true} />

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {filteredStats && TAB_IDS.map(id => (
            <section key={id} id={id}>
              {renderView(id)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
