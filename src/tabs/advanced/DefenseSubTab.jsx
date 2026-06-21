import StatTable from '../shared/StatTable.jsx'
import { calculateDefense } from '../../lib/statsCore.js'
import tabStyles from '../tabs.module.css'

export default function DefenseSubTab({ events, playerId, players }) {
  const rows = calculateDefense(events, playerId ?? null)

  if (playerId) {
    const r = rows[0]
    if (!r) return <p className={tabStyles.placeholder}>No defense data.</p>
    return (
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>Defense</div>
        <div className={tabStyles.statCards}>
          {[['STL', r.STL], ['BLK', r.BLK], ['DEFL', r.DEFLECTION], ['Total', r.Def_Activity]].map(([lbl, val]) => (
            <div key={lbl} className={tabStyles.statCard}>
              <div className={tabStyles.statCardVal}>{val}</div>
              <div className={tabStyles.statCardLbl}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={tabStyles.section}>
      <div className={tabStyles.sectionTitle}>Defense</div>
      <StatTable
        rows={rows}
        cols={[
          { key: 'player',  label: 'Player',  align: 'left' },
          { key: 'STL',     label: 'STL' },
          { key: 'BLK',     label: 'BLK' },
          { key: 'DEFL',    label: 'DEFL' },
          { key: 'charges', label: 'Charges' },
          { key: 'total',   label: 'Total' },
        ]}
        getRow={r => ({
          player: players.find(p => p.playerId === r.player)?.name ?? r.player,
          STL: r.STL,
          BLK: r.BLK,
          DEFL: r.DEFLECTION,
          charges: r.Charges_Drawn,
          total: r.Def_Activity,
        })}
        nameKey="player"
      />
    </div>
  )
}
