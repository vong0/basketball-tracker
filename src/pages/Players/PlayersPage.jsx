import Banner from '../../components/Banner/Banner';
import { mockPlayers } from '../../lib/mockData.js';
import styles from './PlayersPage.module.css';

export default function PlayersPage() {
  return (
    <div className={styles.page}>
      <Banner />
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>ROSTER</div>
          <h1 className={styles.heading}>Players</h1>
          <div className={styles.count}>{mockPlayers.length} players</div>
        </div>
      </div>
      <div className={styles.scroll}>
        <div className={styles.gridWrap}>
          <div className={styles.grid}>
            {mockPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
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
        <span>#{player.number}</span>
        <span className={styles.metaSep}>·</span>
        <span>{player.position}</span>
      </div>
    </a>
  )
}
