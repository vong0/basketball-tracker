import styles from './table.module.css'

export default function StatTable({ rows, cols, getRow, nameKey }) {
  if (!rows.length) return <p className={styles.placeholder}>No data.</p>
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={c.align === 'left' ? { textAlign: 'left' } : {}}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const cells = getRow(row)
              return (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c.key} className={c.align === 'left' ? styles.tdName : undefined}>
                      {cells[c.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.cardGrid}>
        {rows.map((row, i) => {
          const cells = getRow(row)
          return (
            <div key={i} className={styles.card}>
              <div className={styles.cardName}>{cells[nameKey]}</div>
              {cols.filter(c => c.key !== nameKey).map(c => (
                <div key={c.key} className={styles.cardRow}>
                  <span className={styles.cardLbl}>{c.label}</span>
                  <span className={styles.cardVal}>{cells[c.key]}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
