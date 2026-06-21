import styles from './BoxscoreGrid.module.css'

export default function BoxscoreGrid({ row, hidepm = false }) {
  const cells = [
    ['PTS', row.PTS], ['REB', row.REB], ['AST', row.AST], ['STL', row.STL],
    ['BLK', row.BLK], ['TO', row.TO],
  ]
  if (!hidepm) {
    const pm = row.pm != null ? (row.pm >= 0 ? `+${row.pm}` : String(row.pm)) : '—'
    cells.push(['+/-', pm], ['MIN', '—'])
  }
  return (
    <div className={styles.grid}>
      {cells.map(([lbl, val]) => (
        <div key={lbl} className={styles.cell}>
          <div className={styles.val}>{val}</div>
          <div className={styles.lbl}>{lbl}</div>
        </div>
      ))}
    </div>
  )
}
