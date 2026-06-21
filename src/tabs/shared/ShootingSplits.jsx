import { pctText } from '../../lib/statsCore.js'
import styles from '../tabs.module.css'

export default function ShootingSplits({ row }) {
  return (
    <div className={styles.statSubRow}>
      <span className={styles.statChip}>{row.FGM}/{row.FGA} FG ({pctText(row.FG_pct)})</span>
      <span className={styles.statChip}>{row.threePM}/{row.threePA} 3P ({pctText(row.threeP_pct)})</span>
      <span className={styles.statChip}>{row.FTM}/{row.FTA} FT ({pctText(row.FT_pct)})</span>
    </div>
  )
}
