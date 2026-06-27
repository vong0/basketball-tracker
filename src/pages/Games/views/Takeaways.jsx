import styles from './views.module.css'

// entry: TakeawayEntry ({ team: [], players: [{ playerId, name, strengths, improvements }] })
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
      {entry.players.map(p => (
        <div key={p.playerId} className={styles.takeawayCard}>
          <div className={styles.takeawayCardTitle}>{p.name}</div>
          <PlayerTakeawayBlock player={p} />
        </div>
      ))}
    </>
  )
}

function PlayerTakeawayBlock({ player }) {
  return (
    <div className={styles.takeawayColumns}>
      {player.strengths?.length > 0 && (
        <div>
          <div className={styles.takeawayLabel}>Strengths</div>
          <ul className={`${styles.takeawayList} ${styles.takeawayGreen}`}>
            {player.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {player.improvements?.length > 0 && (
        <div>
          <div className={styles.takeawayLabel}>Improvements</div>
          <ul className={`${styles.takeawayList} ${styles.takeawayRed}`}>
            {player.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
