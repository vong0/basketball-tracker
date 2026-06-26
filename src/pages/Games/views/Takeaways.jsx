import styles from './views.module.css'

// entry: TakeawayEntry ({ team: [], players: [{ playerId, name, strengths, improvements }] })
export default function Takeaways({ entry }) {
  if (!entry) return <div className={styles.section}><p className={styles.placeholder}>No takeaways for this game yet.</p></div>

  return (
    <div className={styles.section}>
      {entry.team?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className={styles.sectionTitle}>Team</div>
          <ul className={styles.takeawayList}>
            {entry.team.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}
      {entry.players.map(p => (
        <div key={p.playerId} style={{ marginBottom: 24 }}>
          <div className={styles.sectionTitle}>{p.name}</div>
          <PlayerTakeawayBlock player={p} />
        </div>
      ))}
    </div>
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
