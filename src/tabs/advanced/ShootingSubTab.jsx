import ShotChartSVG from '../../components/ShotChartSVG/ShotChartSVG.jsx'
import StatTable from '../shared/StatTable.jsx'
import { calculateZoneBreakdown, calculateShootingEfficiency, pctText } from '../../lib/statsCore.js'
import tabStyles from '../tabs.module.css'

export default function ShootingSubTab({ shots, freeThrows, playerId, players }) {
  const scopedShots = playerId ? shots.filter(s => s.player === playerId) : shots
  const zones = calculateZoneBreakdown(shots, playerId ?? null)
  const efficiency = calculateShootingEfficiency(shots, freeThrows, playerId ?? null)

  return (
    <>
      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>Shot Chart</div>
        <ShotChartSVG shots={scopedShots} showList={true} />
      </div>

      <div className={tabStyles.section}>
        <div className={tabStyles.sectionTitle}>Zone Breakdown</div>
        <StatTable
          rows={zones}
          cols={[
            { key: 'zone',    label: 'Zone',  align: 'left' },
            { key: 'fgStr',   label: 'FG' },
            { key: 'fgPct',   label: 'FG%' },
            { key: 'PTS',     label: 'PTS' },
            { key: 'freqPct', label: 'FREQ' },
          ]}
          getRow={z => ({
            zone: z.zone,
            fgStr: `${z.FGM}/${z.FGA}`,
            fgPct: pctText(z.FG_pct),
            PTS: z.PTS,
            freqPct: pctText(z.freq_pct),
          })}
          nameKey="zone"
        />
      </div>

      {!playerId && efficiency.length > 0 && (
        <div className={tabStyles.section}>
          <div className={tabStyles.sectionTitle}>Shooting Efficiency</div>
          <StatTable
            rows={efficiency}
            cols={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'eFG',    label: 'eFG%' },
              { key: 'TS',     label: 'TS%' },
            ]}
            getRow={r => ({
              player: players.find(p => p.playerId === r.player)?.name ?? r.player,
              eFG: pctText(r.eFG_pct),
              TS: pctText(r.TS_pct),
            })}
            nameKey="player"
          />
        </div>
      )}
    </>
  )
}
