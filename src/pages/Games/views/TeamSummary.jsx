import { useMemo } from 'react'
import { displayTeamSummary } from '../../../lib/statsCore.js'
import GroupRow from '../../../components/GroupRow/GroupRow.jsx'
import styles from './views.module.css'

export default function TeamSummary({ statsData }) {
  const d = useMemo(() => displayTeamSummary(statsData), [statsData])
  return (
    <div className={styles.section}>
      <GroupRow groups={d.groups} />
    </div>
  )
}
