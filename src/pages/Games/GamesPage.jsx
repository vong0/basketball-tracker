import { useState, useEffect } from 'react';
import Banner from '../../components/Banner/Banner';
import GameCard from './GameCard';
import { getSeasons, getGames } from '../../lib/backend.js';
import styles from './GamesPage.module.css';

export default function GamesPage() {
  const [seasons, setSeasons] = useState(null)
  const [games, setGames] = useState(null)
  const [seasonFilter, setSeasonFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')

  useEffect(() => {
    getSeasons().then(setSeasons)
  }, [])

  useEffect(() => {
    setGames(null)
    getGames({ season: seasonFilter || undefined, result: resultFilter || undefined })
      .then(setGames)
  }, [seasonFilter, resultFilter])

  const hasFilter = seasonFilter || resultFilter

  return (
    <div className={styles.page}>
      <Banner />
      <div className={styles.heroBanner}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>SEASON</div>
          <div className={styles.headingRow}>
            <h1 className={styles.heading}>Games</h1>
          </div>
          <div className={styles.count}>
            {games ? `${games.length} ${games.length === 1 ? 'game' : 'games'}` : '—'}
          </div>
        </div>
      </div>
      <div className={styles.scroll}>
        <div className={styles.headingBlock}>
          <div className={styles.filterRow}>
            <select
              className={styles.filterSelect}
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
            >
              <option value="">All Seasons</option>
              {(seasons ?? []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value)}
            >
              <option value="">All Results</option>
              <option value="W">Wins</option>
              <option value="L">Losses</option>
            </select>
            {hasFilter && (
              <button
                className={styles.filterClear}
                onClick={() => { setSeasonFilter(''); setResultFilter(''); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {!games ? (
          <p className={styles.loading}>Loading…</p>
        ) : (
          <div className={styles.grid}>
            {games.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
