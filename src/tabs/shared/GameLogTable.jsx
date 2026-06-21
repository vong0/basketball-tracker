import styles from './table.module.css'

export default function GameLogTable({ rows }) {
  const headers = [
    { label: 'Game', left: true }, { label: 'Result', left: false },
    { label: 'Opp', left: true },  { label: 'PTS', left: false },
    { label: 'REB', left: false },  { label: 'AST', left: false },
    { label: 'FG', left: false },   { label: '3P', left: false },
    { label: 'FT', left: false },
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
            <tr key={r.gameId}>
              <td className={styles.tdName}>{r.gameLabel}</td>
              <td style={{ color: r.result === 'W' ? 'var(--green)' : 'var(--red)' }}>{r.result}</td>
              <td className={styles.tdName}>{r.opponentName}</td>
              <td>{r.PTS}</td>
              <td>{r.REB}</td>
              <td>{r.AST}</td>
              <td>{r.FGM}/{r.FGA}</td>
              <td>{r.threePM}/{r.threePA}</td>
              <td>{r.FTM}/{r.FTA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
