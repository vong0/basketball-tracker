import StatTable from '../shared/StatTable.jsx'
import { calculateLineups } from '../../lib/statsCore.js'
import tabStyles from '../tabs.module.css'

export default function LineupsSubTab({ lineupStints, players }) {
  const rows = calculateLineups(lineupStints, players.map(p => ({ id: p.playerId, name: p.name })))

  return (
    <div className={tabStyles.section}>
      <div className={tabStyles.sectionTitle}>Lineups (Top 5 by Net +/-)</div>
      <StatTable
        rows={rows}
        cols={[
          { key: 'lineup', label: 'Lineup',   align: 'left' },
          { key: 'net',    label: 'Net +/-' },
          { key: 'stints', label: 'Stints' },
        ]}
        getRow={r => ({
          lineup: r.lineup_names,
          net: r.net_points >= 0 ? `+${r.net_points}` : String(r.net_points),
          stints: r.stints,
        })}
        nameKey="lineup"
      />
    </div>
  )
}
