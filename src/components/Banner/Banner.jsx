import { useState, useEffect } from 'react';
import styles from './Banner.module.css';

const NAV_ITEMS = [
  { label: 'Games',      href: '#/games' },
  { label: 'Players',    href: '#/players' },
  { label: 'Opponents',  href: '#/opponents' },
  { label: 'Strategies', href: '#/strategies' },
]

const BallIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#ff5c1a" />
    <path
      d="M2 12 H22 M12 2 V22 M5 5 Q12 12 19 5 M5 19 Q12 12 19 19"
      stroke="rgba(0,0,0,0.6)"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
)

export default function Banner() {
  const [hash, setHash] = useState(
    typeof window !== 'undefined' ? window.location.hash : ''
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash)
      setDrawerOpen(false)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className={styles.banner}>
      <a className={styles.brand} href="#/" aria-label="Home">
        <BallIcon />
        <span className={styles.wordmark}>Spartans</span>
      </a>

      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map(item => {
          const active = hash.startsWith(item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      <button
        className={styles.hamburger}
        aria-label="Open navigation"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(o => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {drawerOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <a href="#/" className={styles.drawerBrand} onClick={() => setDrawerOpen(false)}>
                <BallIcon />
                <span className={styles.drawerWordmark}>Spartans</span>
              </a>
              <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {NAV_ITEMS.map(item => {
              const active = hash.startsWith(item.href)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={active ? `${styles.drawerLink} ${styles.drawerLinkActive}` : styles.drawerLink}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </a>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
