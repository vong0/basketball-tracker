import styles from './ScopeBar.module.css'

export const pickerClass = styles.picker

export default function ScopeBar({ children }) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
