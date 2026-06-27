import { useMemo } from 'react'
import { displayTeamAdvancedStats } from '../../../lib/statDisplay.js'
import GroupRow from '../../../components/GroupRow/GroupRow.jsx'
import styles from './views.module.css'

export default function AdvancedStats({ statsData }) {
  const d = useMemo(() => displayTeamAdvancedStats(statsData), [statsData])
  return (
    <div className={styles.section}>
      <GroupRow groups={d.groups} />
    </div>
  )
}
