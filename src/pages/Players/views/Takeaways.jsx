import { gameLabel } from '../../../lib/backend.js'
import styles from './views.module.css'

// entries: TakeawayEntry[] already filtered to this player
export default function Takeaways({ entries }) {
  if (!entries) return <p className={styles.placeholder}>Loading…</p>
  if (!entries.length) return <p className={styles.placeholder}>No takeaways yet.</p>

  return (
    <>
      {entries.map(entry => {
        const p = entry.players[0]
        if (!p) return null
        return (
          <div key={entry.gameId} className={styles.section}>
            {entry.game && (
              <>
                <div className={styles.sectionTitle}>
                  {gameLabel(entry.game)} — vs {entry.game.opponentName}
                </div>
                <div className={styles.sectionDate}>{entry.game.date}</div>
              </>
            )}
            <div className={styles.takeawayColumns}>
              {p.strengths?.length > 0 && (
                <div>
                  <div className={styles.takeawayLabel}>Strengths</div>
                  <ul className={`${styles.takeawayList} ${styles.takeawayGreen}`}>
                    {p.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {p.improvements?.length > 0 && (
                <div>
                  <div className={styles.takeawayLabel}>Improvements</div>
                  <ul className={`${styles.takeawayList} ${styles.takeawayRed}`}>
                    {p.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
