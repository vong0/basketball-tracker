import { useMemo } from 'react'
import { PLAYLISTS, presetFilter, countClips } from '../../../lib/clipsCore'
import { navigate } from '../../../lib/routing'
import styles from './Clips.module.css'

export default function Clips({ allClips, player, isMobile, loading, playerId }) {
  const clipName = player?.clipName ?? null

  const counts = useMemo(() => {
    if (!allClips) return {}
    return Object.fromEntries(
      PLAYLISTS.map(pl => [pl.key, countClips(allClips, presetFilter(pl, clipName))])
    )
  }, [allClips, clipName])

  if (loading) {
    return <p className={styles.placeholder}>Loading clips…</p>
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Playlists</div>
      <div className={styles.grid}>
        {PLAYLISTS.map(pl => {
          const count = counts[pl.key] ?? 0
          return (
            <button
              key={pl.key}
              className={`${styles.card} ${count === 0 ? styles.cardEmpty : ''}`}
              onClick={() => navigate('#/player-clips/' + playerId + '?preset=' + pl.key)}
              disabled={count === 0}
            >
              <div className={styles.cardLabel}>{pl.label}</div>
              <div className={styles.cardCount}>{count}</div>
              <div className={styles.cardMeta}>clips</div>
              <div className={styles.watchLink}>▶ Watch</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
