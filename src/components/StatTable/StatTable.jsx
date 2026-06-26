import styles from './StatTable.module.css'

function isCellObject(cell) {
  return cell !== null && typeof cell === 'object' && 'value' in cell
}

function renderCell(cell) {
  if (isCellObject(cell)) {
    return (
      <>
        <span>{cell.value ?? '—'}</span>
        {cell.secondary !== undefined && <span className={styles.secondary}>{cell.secondary}</span>}
      </>
    )
  }
  return cell ?? '—'
}

function cardText(cell) {
  if (isCellObject(cell)) {
    return cell.secondary !== undefined ? `${cell.value ?? '—'} ${cell.secondary}` : (cell.value ?? '—')
  }
  return cell ?? '—'
}

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
                      {renderCell(cells[c.key])}
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
              <div className={styles.cardName}>{cardText(cells[nameKey])}</div>
              {cols.filter(c => c.key !== nameKey).map(c => (
                <div key={c.key} className={styles.cardRow}>
                  <span className={styles.cardLbl}>{c.label}</span>
                  <span className={styles.cardVal}>{cardText(cells[c.key])}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
