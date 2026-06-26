import { useMemo } from 'react'
import { getGameOverview } from '../../../lib/statsCore.js'
import StatCardGrid from '../../../components/StatCardGrid/StatCardGrid.jsx'
import styles from './views.module.css'

export default function Overview({ statsData, players }) {
  const ov = useMemo(() => getGameOverview(statsData), [statsData])
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])
  if (!ov) return null

  const name = id => nameMap[id] || id
  const { leader_cards, shot_quality_note, best_zone, needs_attention, story_cards, half_splits, team_control_dashboard } = ov

  return (
    <div className={styles.section}>
      <div className={styles.leaderRow}>
        {Object.values(leader_cards).filter(Boolean).map(lc => (
          <div key={lc.player + lc.label} className={styles.leaderCard}>
            <div className={styles.leaderName}>{name(lc.player)}</div>
            <div className={styles.leaderValue}>{lc.value}</div>
            <div className={styles.leaderLabel}>{lc.label}</div>
          </div>
        ))}
      </div>

      {(shot_quality_note || best_zone || needs_attention.length > 0) && (
        <div className={styles.infoGrid}>
          {shot_quality_note && (
            <div className={styles.infoBlock}>
              <div className={styles.infoTitle}>Shot Quality</div>
              <div className={styles.infoText}>{shot_quality_note}</div>
            </div>
          )}
          {best_zone && (
            <div className={styles.infoBlock}>
              <div className={styles.infoTitle}>Best Zone</div>
              <div className={styles.infoText}>{best_zone.label}: {best_zone.FGM}/{best_zone.FGA}, {best_zone.PPS} PPS</div>
            </div>
          )}
          {needs_attention.length > 0 && (
            <div className={styles.infoBlock}>
              <div className={styles.infoTitle}>Needs Attention</div>
              <ul className={styles.attentionList}>
                {needs_attention.map((item, i) => (
                  <li key={i}><strong>{item.title}:</strong> {item.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <StatCardGrid cards={story_cards} cols={4} />

      {half_splits.length > 0 && (
        <div className={styles.halfSplits}>
          <div className={styles.subTitle}>Half Splits</div>
          <div className={styles.tableWrap}>
            <table className={styles.splitTable}>
              <thead>
                <tr>
                  {['Half','PTS','FG','3PT','FT','TS%','AST','TOV','Fouls','OREB','DREB','STL','BLK','Bad%'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {half_splits.map(row => (
                  <tr key={row.half}>
                    <td>{row.half}</td>
                    <td>{row.PTS}</td>
                    <td>{row.FG?.value}<span className={styles.splitSec}>{row.FG?.secondary}</span></td>
                    <td>{row.threePoint?.value}<span className={styles.splitSec}>{row.threePoint?.secondary}</span></td>
                    <td>{row.FT?.value}<span className={styles.splitSec}>{row.FT?.secondary}</span></td>
                    <td>{row.TS_pct}</td>
                    <td>{row.AST}</td>
                    <td>{row.TOV}</td>
                    <td>{row.Fouls}</td>
                    <td>{row.OREB}</td>
                    <td>{row.DREB}</td>
                    <td>{row.STL}</td>
                    <td>{row.BLK}</td>
                    <td>{row.Bad_Shot_Rate_pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.subTitle}>Team Control</div>
      <StatCardGrid cards={team_control_dashboard} cols={4} />
    </div>
  )
}
