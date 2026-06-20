import { useState } from 'react';
import Banner from '../../components/Banner/Banner';
import { mockPlayers, mockGames, mockTakeaways, mockClipCounts, gameLabel } from '../../lib/mockData.js';
import styles from './PlayerDetailPage.module.css';

const PLAYLISTS = [
  { label: 'All Clips',    key: 'all' },
  { label: 'Good Offense', key: 'goodOffense' },
  { label: 'Bad Offense',  key: 'badOffense' },
  { label: 'Good Defense', key: 'goodDefense' },
  { label: 'Bad Defense',  key: 'badDefense' },
]

const TABS = ['Takeaways', 'Stats', 'Advanced', 'Clips']

export default function PlayerDetailPage({ playerId }) {
  const player = mockPlayers.find(p => p.id === playerId)

  // All takeaway entries mentioning this player
  const playerTakeaways = mockTakeaways
    .map(t => ({
      game: mockGames.find(g => g.id === t.gameId),
      team: t.team,
      player: t.players.find(p => p.playerId === playerId),
    }))
    .filter(t => t.player && t.game)

  const [scope, setScope] = useState('')
  const [tab, setTab] = useState('Takeaways')

  if (!player) {
    return (
      <div className={styles.page}>
        <Banner />
        <p className={styles.placeholder}>Player not found.</p>
      </div>
    )
  }

  const initial = player.name.charAt(0).toUpperCase()

  // Scoped takeaway entries
  const displayTakeaways = scope
    ? playerTakeaways.filter(t => t.game.id === scope)
    : playerTakeaways

  // Clip counts
  const clipCountsForScope = () => {
    if (scope) return mockClipCounts[scope] ?? {}
    // Sum across all games the player appears in
    const summed = {}
    playerTakeaways.forEach(t => {
      const counts = mockClipCounts[t.game.id] ?? {}
      PLAYLISTS.forEach(pl => {
        summed[pl.key] = (summed[pl.key] ?? 0) + (counts[pl.key] ?? 0)
      })
    })
    return summed
  }

  const clipCounts = clipCountsForScope()
  const mostRecentGame = playerTakeaways[0]?.game

  const clipsGameId = scope || mostRecentGame?.id || ''
  const clipsBase = clipsGameId ? `#/game/${clipsGameId}?player=${playerId}` : `#/`

  return (
    <div className={styles.page}>
      <Banner />

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBody}>
            <div className={styles.photoWrap}>
              {player.photo ? (
                <img src={player.photo} alt={player.name} className={styles.photo} />
              ) : (
                <div className={styles.initials}>{initial}</div>
              )}
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.heroName}>{player.name}</div>
              <div className={styles.heroMeta}>
                <span>#{player.number}</span>
                <span className={styles.metaSep}>·</span>
                <span>{player.position}</span>
              </div>
            </div>
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
            <option value="">All Games (Career)</option>
            {playerTakeaways.map(t => (
              <option key={t.game.id} value={t.game.id}>
                {gameLabel(t.game)} vs {t.game.opponentName}
              </option>
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
            <TakeawaysTab displayTakeaways={displayTakeaways} player={player} />
          )}
          {tab === 'Stats' && (
            <p className={styles.placeholder}>Stats coming soon.</p>
          )}
          {tab === 'Advanced' && (
            <p className={styles.placeholder}>Advanced stats coming soon.</p>
          )}
          {tab === 'Clips' && (
            <ClipsTab clipCounts={clipCounts} clipsBase={clipsBase} />
          )}
        </div>
      </div>
    </div>
  )
}

function TakeawaysTab({ displayTakeaways, player }) {
  if (!displayTakeaways.length) {
    return <p className={styles.placeholder}>No takeaways yet.</p>
  }

  return (
    <>
      {displayTakeaways.map(t => (
        <div key={t.game.id} className={styles.section}>
          <div className={styles.sectionTitle}>
            {gameLabel(t.game)} — vs {t.game.opponentName}
          </div>
          <div className={styles.sectionDate}>{t.game.date}</div>
          {t.team?.length > 0 && (
            <div className={styles.teamNote}>
              <div className={styles.takeawayLabel}>Team Notes</div>
              <ul className={styles.takeawayList}>
                {t.team.map((note, i) => <li key={i}>{note}</li>)}
              </ul>
            </div>
          )}
          <div className={styles.takeawayColumns}>
            {t.player.strengths?.length > 0 && (
              <div>
                <div className={styles.takeawayLabel}>Strengths</div>
                <ul className={`${styles.takeawayList} ${styles.takeawayGreen}`}>
                  {t.player.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {t.player.improvements?.length > 0 && (
              <div>
                <div className={styles.takeawayLabel}>Improvements</div>
                <ul className={`${styles.takeawayList} ${styles.takeawayRed}`}>
                  {t.player.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}

function ClipsTab({ clipCounts, clipsBase }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.clipsGrid}>
        {PLAYLISTS.map(pl => {
          const count = clipCounts[pl.key] ?? 0
          return (
            <div key={pl.key} className={styles.clipCard}>
              <div className={styles.clipLabel}>{pl.label}</div>
              <div className={styles.clipCount}>{count}</div>
              <div className={styles.clipMeta}>clips</div>
              <a href={clipsBase} className={styles.clipWatch}>▶ Watch</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
