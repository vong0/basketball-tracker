import tabStyles from './tabs.module.css'

// entry: TakeawayEntry ({ team: [], players: [{ playerId, name, strengths, improvements }] })
// scope: '' (all) | playerId
export default function GameTakeawaysTab({ entry, scope }) {
  if (!entry) return <p className={tabStyles.placeholder}>No takeaways for this game yet.</p>

  if (scope) {
    const p = entry.players.find(p => p.playerId === scope)
    if (!p) return <p className={tabStyles.placeholder}>No takeaways for this player.</p>
    return (
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>{p.name}</div>
        <PlayerTakeawayBlock player={p} />
      </div>
    )
  }

  return (
    <>
      {entry.team?.length > 0 && (
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>Team</div>
          <ul className={tabStyles.takeawayList}>
            {entry.team.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}
      {entry.players.map(p => (
        <div key={p.playerId} className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>{p.name}</div>
          <PlayerTakeawayBlock player={p} />
        </div>
      ))}
    </>
  )
}

function PlayerTakeawayBlock({ player }) {
  return (
    <div className={tabStyles.takeawayColumns}>
      {player.strengths?.length > 0 && (
        <div>
          <div className={tabStyles.takeawayLabel}>Strengths</div>
          <ul className={`${tabStyles.takeawayList} ${tabStyles.takeawayGreen}`}>
            {player.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {player.improvements?.length > 0 && (
        <div>
          <div className={tabStyles.takeawayLabel}>Improvements</div>
          <ul className={`${tabStyles.takeawayList} ${tabStyles.takeawayRed}`}>
            {player.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
