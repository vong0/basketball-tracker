import { useState, useEffect } from 'react';
import Banner from '../../components/Banner/Banner';
import { getPlayers } from '../../lib/backend.js';
import styles from './PlayersPage.module.css';

export default function PlayersPage() {
  const [players, setPlayers] = useState(null)

  useEffect(() => {
    getPlayers().then(setPlayers)
  }, [])

  return (
    <div className={styles.page}>
      <Banner />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>ROSTER</div>
          <h1 className={styles.heading}>Players</h1>
          <div className={styles.count}>{players ? `${players.length} players` : '—'}</div>
        </div>
      </div>
      <div className={styles.scroll}>
        <div className={styles.gridWrap}>
          <a href="#/players/team" className={styles.teamLink}>
            <span>View Team</span>
            <span>→</span>
          </a>
          {!players ? (
            <p className={styles.loading}>Loading…</p>
          ) : (
            <div className={styles.grid}>
              {players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerCard({ player }) {
  const initial = player.name.charAt(0).toUpperCase()
  return (
    <a href={`#/players/${player.id}`} className={styles.card}>
      <div className={styles.photoWrap}>
        {player.photo ? (
          <img src={player.photo} alt={player.name} className={styles.photo} />
        ) : (
          <div className={styles.initials}>{initial}</div>
        )}
      </div>
      <div className={styles.name}>{player.name}</div>
      <div className={styles.meta}>
        {player.number && <><span>#{player.number}</span><span className={styles.metaSep}>·</span></>}
        <span>{player.position}</span>
      </div>
    </a>
  )
}
