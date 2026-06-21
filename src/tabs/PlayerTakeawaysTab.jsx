import { gameLabel } from '../lib/backend.js'
import tabStyles from './tabs.module.css'

// entries: TakeawayEntry[] already filtered to this player
export default function PlayerTakeawaysTab({ entries }) {
  if (!entries) return <p className={tabStyles.placeholder}>Loading…</p>
  if (!entries.length) return <p className={tabStyles.placeholder}>No takeaways yet.</p>

  return (
    <>
      {entries.map(entry => {
        const p = entry.players[0]
        if (!p) return null
        return (
          <div key={entry.gameId} className={tabStyles.section}>
            {entry.game && (
              <>
                <div className={tabStyles.sectionTitle}>
                  {gameLabel(entry.game)} — vs {entry.game.opponentName}
                </div>
                <div className={tabStyles.sectionDate}>{entry.game.date}</div>
              </>
            )}
            <div className={tabStyles.takeawayColumns}>
              {p.strengths?.length > 0 && (
                <div>
                  <div className={tabStyles.takeawayLabel}>Strengths</div>
                  <ul className={`${tabStyles.takeawayList} ${tabStyles.takeawayGreen}`}>
                    {p.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {p.improvements?.length > 0 && (
                <div>
                  <div className={tabStyles.takeawayLabel}>Improvements</div>
                  <ul className={`${tabStyles.takeawayList} ${tabStyles.takeawayRed}`}>
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
