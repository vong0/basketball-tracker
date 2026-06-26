import { useEffect, useRef } from 'react'
import styles from './TabBar.module.css'

export default function TabBar({ tabs, active, onChange, scrollMode = false }) {
  const idx = tabs.indexOf(active)
  const stripRef = useRef(null)

  useEffect(() => {
    if (!stripRef.current) return
    const btn = stripRef.current.querySelector(`[data-tab="${active}"]`)
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [active])

  function go(t) {
    if (scrollMode) {
      const id = t.toLowerCase().replace(/\s+/g, '-')
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onChange(t)
  }

  return (
    <div className={styles.bar}>
      <button className={styles.arrow} disabled={idx <= 0} onClick={() => go(tabs[idx - 1])} aria-label="Previous">‹</button>
      <div className={styles.strip} ref={stripRef}>
        {tabs.map(t => (
          <button key={t} data-tab={t}
            className={t === active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => go(t)}
          >{t}</button>
        ))}
      </div>
      <button className={styles.arrow} disabled={idx >= tabs.length - 1} onClick={() => go(tabs[idx + 1])} aria-label="Next">›</button>
    </div>
  )
}
