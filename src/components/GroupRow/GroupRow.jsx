import styles from './GroupRow.module.css'

export default function GroupRow({ groups = [] }) {
  if (!groups.length) return null
  return (
    <div className={styles.grid}>
      {groups.map((g, i) => (
        <div key={g.title + i} className={styles.group}>
          {g.title && <div className={styles.groupTitle}>{g.title}</div>}
          {g.placeholder
            ? <div className={styles.placeholder}>{g.placeholder}</div>
            : (g.rows ?? []).map((r, j) => (
              <div key={r.label + j} className={styles.row}>
                <span className={styles.label}>{r.label}</span>
                <span className={styles.value}>
                  {r.value ?? '—'}
                  {r.secondary !== undefined && (
                    <span className={styles.secondary}>{r.secondary}</span>
                  )}
                </span>
              </div>
            ))
          }
        </div>
      ))}
    </div>
  )
}
