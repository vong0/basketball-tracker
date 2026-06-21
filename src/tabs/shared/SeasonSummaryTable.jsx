import { pctText } from '../../lib/statsCore.js'
import styles from './table.module.css'

export default function SeasonSummaryTable({ rows }) {
  const headers = [
    { label: 'Season', left: true }, { label: 'G', left: false },
    { label: 'W-L', left: false },   { label: 'PPG', left: false },
    { label: 'RPG', left: false },   { label: 'APG', left: false },
    { label: 'FG%', left: false },   { label: '3P%', left: false },
    { label: 'FT%', left: false },
  ]
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h.label} style={h.left ? { textAlign: 'left' } : {}}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.season}>
              <td className={styles.tdName}>{r.season}</td>
              <td>{r.gameCount}</td>
              <td>{r.wins}–{r.losses}</td>
              <td>{r.PTS_avg}</td>
              <td>{r.REB_avg}</td>
              <td>{r.AST_avg}</td>
              <td>{pctText(r.FG_pct)}</td>
              <td>{pctText(r.threeP_pct)}</td>
              <td>{pctText(r.FT_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
