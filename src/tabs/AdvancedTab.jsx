import { useState } from 'react'
import ShootingSubTab from './advanced/ShootingSubTab.jsx'
import CreationSubTab from './advanced/CreationSubTab.jsx'
import DefenseSubTab  from './advanced/DefenseSubTab.jsx'
import LineupsSubTab  from './advanced/LineupsSubTab.jsx'
import tabStyles from './tabs.module.css'
import styles from './AdvancedTab.module.css'

// players: [{ playerId, name }]
// playerId: string (filter to one player) or null (all players)
// showLineups: show the Lineups sub-tab (game/team views)
export default function AdvancedTab({ shots, events, freeThrows, lineupStints, players, playerId, showLineups }) {
  const tabs = ['Shooting', 'Creation', 'Defense', ...(showLineups ? ['Lineups'] : [])]
  const [active, setActive] = useState('Shooting')

  if (!shots) return <p className={tabStyles.placeholder}>Loading…</p>

  return (
    <>
      <div className={styles.subTabs}>
        {tabs.map(t => (
          <button
            key={t}
            className={t === active ? `${styles.subTab} ${styles.subTabActive}` : styles.subTab}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {active === 'Shooting' && (
        <ShootingSubTab shots={shots} freeThrows={freeThrows} playerId={playerId} players={players} />
      )}
      {active === 'Creation' && (
        <CreationSubTab events={events} shots={shots} playerId={playerId} players={players} />
      )}
      {active === 'Defense' && (
        <DefenseSubTab events={events} playerId={playerId} players={players} />
      )}
      {active === 'Lineups' && showLineups && (
        <LineupsSubTab lineupStints={lineupStints} players={players} />
      )}
    </>
  )
}
