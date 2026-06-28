import { useMemo } from 'react'
import { displayGameOverview } from '../../../lib/statsCore.js'
import MetricRow from '../../../components/MetricRow/MetricRow.jsx'
import GroupRow from '../../../components/GroupRow/GroupRow.jsx'
import DataTable from '../../../components/DataTable/DataTable.jsx'
import styles from './views.module.css'

export default function Overview({ statsData, players }) {
  const nameMap = useMemo(() => Object.fromEntries((players ?? []).map(p => [p.playerId, p.name])), [players])
  const d = useMemo(() => displayGameOverview(statsData, nameMap), [statsData, nameMap])
  if (!d) return null

  return (
    <div className={styles.section}>
      <MetricRow cards={d.leaders} cols={5} />

      {d.notes.length > 0 && (
        <div className={styles.noteGrid}>
          {d.notes.map((n, i) => (
            <div key={i} className={`${styles.noteBlock}${n.variant ? ` ${styles[n.variant]}` : ''}`}>
              <div className={styles.noteTitle}>{n.title}</div>
              <div className={styles.noteBody}>{n.body}</div>
            </div>
          ))}
        </div>
      )}

      <MetricRow cards={d.metrics} cols={4} />

      {d.halfSplits.length > 0 && (
        <>
          <div className={styles.subTitle}>Half Splits</div>
          <HalfSplitsTable halves={d.halfSplits} />
        </>
      )}

      <div className={styles.subTitle}>Team Control</div>
      <MetricRow cards={d.teamControl} cols={4} />
    </div>
  )
}

function HalfSplitsTable({ halves }) {
  if (!halves.length) return null
  const cols = halves[0].rows.map(r => r.label)
  const desc = {
    columns: [
      { key: '_half', type: 'name', label: 'Half' },
      ...cols.map(label => ({ key: label, type: 'ratio', label })),
    ],
    rows: halves.map(half => ({
      _half: half.title,
      ...Object.fromEntries(half.rows.map(r => [
        r.label,
        r.secondary !== undefined ? { value: r.value, secondary: r.secondary } : r.value,
      ])),
    })),
  }
  return <DataTable desc={desc} />
}
