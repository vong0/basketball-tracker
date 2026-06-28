import styles from './DataTable.module.css'

function isCellObject(cell) {
  return cell !== null && typeof cell === 'object' && 'value' in cell
}

function renderCell(cell) {
  if (isCellObject(cell)) {
    return (
      <>
        <span>{cell.value ?? '—'}</span>
        {cell.secondary !== undefined && (
          <span className={styles.secondary}>{cell.secondary}</span>
        )}
      </>
    )
  }
  return cell ?? '—'
}

function cardText(cell) {
  if (isCellObject(cell)) {
    return cell.secondary !== undefined
      ? `${cell.value ?? '—'} ${cell.secondary}`
      : (cell.value ?? '—')
  }
  return cell ?? '—'
}

export default function DataTable({ desc, dense = false }) {
  if (!desc) return null
  const { columns, rows } = desc
  if (!rows?.length) return <p className={styles.placeholder}>No data.</p>

  const nameCol = columns.find(c => c.type === 'name')

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={`${styles.table}${dense ? ' ' + styles.dense : ''}`}>
          <thead>
            <tr>
              {columns.map(c => (
                <th
                  key={c.key}
                  className={c.type === 'name' ? styles.thName : styles.thNum}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td
                    key={c.key}
                    className={c.type === 'name' ? styles.tdName : styles.tdNum}
                  >
                    {renderCell(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.cardGrid}>
        {rows.map((row, i) => (
          <div key={i} className={styles.card}>
            {nameCol && (
              <div className={styles.cardName}>{cardText(row[nameCol.key])}</div>
            )}
            {columns.filter(c => c.type !== 'name').map(c => (
              <div key={c.key} className={styles.cardRow}>
                <span className={styles.cardLbl}>{c.label}</span>
                <span className={styles.cardVal}>{cardText(row[c.key])}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
