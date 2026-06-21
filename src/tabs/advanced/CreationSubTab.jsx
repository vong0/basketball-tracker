import StatTable from '../shared/StatTable.jsx'
import { calculateCreation } from '../../lib/statsCore.js'
import tabStyles from '../tabs.module.css'

export default function CreationSubTab({ events, shots, playerId, players }) {
  const rows = calculateCreation(events, shots, playerId ?? null)

  if (playerId) {
    const r = rows[0]
    if (!r) return <p className={tabStyles.placeholder}>No creation data.</p>
    return (
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>Creation</div>
        <div className={tabStyles.statCards}>
          {[['AST', r.AST], ['TO', r.TO], ['Pot. AST', r.Potential_AST], ['Adv', r.Adv_Created]].map(([lbl, val]) => (
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
      <div className={tabStyles.sectionTitle}>Creation</div>
      <StatTable
        rows={rows}
        cols={[
          { key: 'player',  label: 'Player',    align: 'left' },
          { key: 'AST',     label: 'AST' },
          { key: 'TO',      label: 'TO' },
          { key: 'potAST',  label: 'Pot. AST' },
          { key: 'adv',     label: 'Adv. Created' },
        ]}
        getRow={r => ({
          player: players.find(p => p.playerId === r.player)?.name ?? r.player,
          AST: r.AST,
          TO: r.TO,
          potAST: r.Potential_AST,
          adv: r.Adv_Created,
        })}
        nameKey="player"
      />
    </div>
  )
}
