import { useState, useEffect, useRef } from 'react'
import Banner from '../../components/Banner/Banner'
import TabBar from '../../components/TabBar/TabBar.jsx'
import Overview from './views/Overview.jsx'
import BoxScore from './views/BoxScore.jsx'
import StatLeaders from './views/StatLeaders.jsx'
import TeamSummary from './views/TeamSummary.jsx'
import Takeaways from './views/Takeaways.jsx'
import ShotChart from './views/ShotChart.jsx'
import AdvancedStats from './views/AdvancedStats.jsx'
import { getGame, getTakeaways, getGameScopes, getStats } from '../../lib/backend.js'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}
import { navigate } from '../../lib/routing.js'
import styles from './GameDetailPage.module.css'

const TABS = ['Overview', 'Box Score', 'Stat Leaders', 'Team Summary', 'Takeaways', 'Shot Chart', 'Advanced Stats']
const TAB_IDS = TABS.map(t => t.toLowerCase().replace(/\s+/g, '-'))

export default function GameDetailPage({ gameId, isMobile }) {
  const [game, setGame] = useState(null)
  const [takeawayEntry, setTakeawayEntry] = useState(null)
  const [players, setPlayers] = useState([])
  const [statsData, setStatsData] = useState(null)
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

  const suppressScroll = useRef(false)
  const suppressTimer = useRef(null)

  // When user clicks a tab: set immediately, then ignore scroll events for ~700ms
  // so the smooth-scroll animation doesn't cause flicker
  function handleTabChange(tab) {
    setActiveTab(tab)
    suppressScroll.current = true
    clearTimeout(suppressTimer.current)
    suppressTimer.current = setTimeout(() => { suppressScroll.current = false }, 700)
  }

  useEffect(() => {
    if (!statsData) return
    const sections = TAB_IDS.map(id => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return
    const THRESHOLD = 120 // banner 56px + tabbar 44px + buffer

    function onScroll() {
      if (suppressScroll.current) return

      // If near the bottom of the page, the last section is active regardless
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 60) {
        setActiveTab(TABS[TABS.length - 1])
        return
      }

      // Walk sections: last one whose top is at/above THRESHOLD wins
      let active = sections[0]
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= THRESHOLD) {
          active = section
        } else {
          break
        }
      }
      setActiveTab(TABS[TAB_IDS.indexOf(active.id)])
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(suppressTimer.current)
    }
  }, [statsData])

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
  const spartansWon = game.result === 'W'
  const thumbUrl = game.videoId ? `https://img.youtube.com/vi/${game.videoId}/maxresdefault.jpg` : null

  function renderView(id) {
    switch (id) {
      case 'overview':       return <Overview statsData={statsData} players={players} />
      case 'box-score':      return <BoxScore statsData={statsData} players={players} />
      case 'stat-leaders':   return <StatLeaders statsData={statsData} players={players} />
      case 'team-summary':   return <TeamSummary statsData={statsData} />
      case 'takeaways':      return <Takeaways entry={takeawayEntry} />
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
          <div className={styles.heroTop}>
            <span className={styles.gameLabel}>{game.id}</span>
            <span className={`${styles.resultBadge} ${resultClass}`}>{game.result}</span>
            {game.gloryLeagueUrl && (
              <a href={game.gloryLeagueUrl} target="_blank" rel="noopener noreferrer" className={styles.gloryLink}>
                Glory League ↗
              </a>
            )}
          </div>

          <div className={styles.scoreLayout}>
            <div className={styles.teamSide}>
              <span className={`${styles.scoreNum} ${spartansWon ? '' : styles.scoreNumFaded}`}>
                {game.teamScore}
              </span>
              <span className={styles.heroTeamName}>Spartans</span>
            </div>
            <span className={styles.scoreSep}>–</span>
            <div className={`${styles.teamSide} ${styles.teamSideRight}`}>
              <span className={`${styles.scoreNum} ${spartansWon ? styles.scoreNumFaded : ''}`}>
                {game.opponentScore}
              </span>
              <span className={styles.heroTeamName}>{game.opponentName}</span>
            </div>
          </div>

          <div className={styles.metaRow}>
            <span>{formatDate(game.date)}</span>
          </div>

          {thumbUrl && (
            <div className={styles.heroThumb}>
              <a href={`#/game/${game.id}`} className={styles.thumbLink} aria-label="Watch clips">
                <img src={thumbUrl} alt="Game thumbnail" className={styles.thumbImg} />
                <div className={styles.thumbOverlay}>
                  <div className={styles.thumbPlayCircle}>
                    <div className={styles.thumbPlayIcon} />
                  </div>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} scrollMode={true} />

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {statsData && TAB_IDS.map((id, i) => (
            <section key={id} id={id} className={styles.viewSection}>
              <div className={styles.sectionHeading}>{TABS[i]}</div>
              {renderView(id)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
