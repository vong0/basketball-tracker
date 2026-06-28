import { gameLabel } from '../../../lib/backend.js'
import styles from './views.module.css'

// entries: TakeawayEntry[] already filtered to this player
export default function Takeaways({ entries }) {
  if (!entries) return <p className={styles.placeholder}>Loading…</p>

  if (!entries.length) {
    return <p className={styles.placeholder}>No takeaways yet.</p>
  }

  return (
    <>
      {entries.map(entry => {
        const p = entry.players[0]
        return (
          <div key={entry.gameId} className={styles.takeawayCard}>
            {entry.game && (
              <div className={styles.takeawayCardTitle}>
                {gameLabel(entry.game)} — vs {entry.game.opponentName}
                <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: 'var(--text-faint)', marginTop: 2 }}>
                  {entry.game.date}
                </span>
              </div>
            )}
            {!p || (!p.strengths?.length && !p.improvements?.length) ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-faint)' }}>No takeaways for this game.</p>
            ) : (
              <div className={styles.takeawayColumns}>
                {p.strengths?.length > 0 && (
                  <div>
                    <div className={`${styles.takeawayLabel} ${styles.takeawayLabelStrength}`}>Strengths</div>
                    <ul className={styles.takeawayList}>
                      {p.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {p.improvements?.length > 0 && (
                  <div>
                    <div className={`${styles.takeawayLabel} ${styles.takeawayLabelImprovement}`}>Improvements</div>
                    <ul className={styles.takeawayList}>
                      {p.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
