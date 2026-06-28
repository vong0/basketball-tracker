import styles from './views.module.css'

export default function Takeaways({ entry }) {
  const isEmpty = !entry || (!entry.team?.length && !entry.players?.length)

  if (isEmpty) {
    return <p className={styles.placeholder}>No takeaways for this game.</p>
  }

  return (
    <>
      {entry.team?.length > 0 && (
        <div className={styles.takeawayCard}>
          <div className={styles.takeawayCardTitle}>Team</div>
          <ul className={styles.takeawayList}>
            {entry.team.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}
      {entry.players?.length > 0 && (
        <div className={styles.takeawayPlayerGrid}>
          {entry.players.map(p => (
            <div key={p.playerId} className={styles.takeawayCard}>
              <div className={styles.takeawayCardTitle}>{p.name}</div>
              <PlayerTakeawayBlock player={p} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function PlayerTakeawayBlock({ player }) {
  return (
    <div className={styles.takeawayStack}>
      {player.strengths?.length > 0 && (
        <div>
          <div className={`${styles.takeawayLabel} ${styles.takeawayLabelStrength}`}>Strengths</div>
          <ul className={styles.takeawayList}>
            {player.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {player.improvements?.length > 0 && (
        <div>
          <div className={`${styles.takeawayLabel} ${styles.takeawayLabelImprovement}`}>Improvements</div>
          <ul className={styles.takeawayList}>
            {player.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
