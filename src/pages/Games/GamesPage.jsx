import { useState } from 'react';
import Banner from '../../components/Banner/Banner';
import GameCard from './GameCard';
import { mockGames } from '../../lib/mockData.js';
import styles from './GamesPage.module.css';

const ALL_SEASONS = [...new Set(mockGames.map(g => g.season))].sort().reverse();

export default function GamesPage() {
  const [seasonFilter, setSeasonFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const games = mockGames.filter(g => {
    if (seasonFilter && g.season !== seasonFilter) return false;
    if (resultFilter && g.result !== resultFilter) return false;
    return true;
  });

  const hasFilter = seasonFilter || resultFilter;

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
            {games.length} {games.length === 1 ? 'game' : 'games'}
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
              {ALL_SEASONS.map(s => (
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
        <div className={styles.grid}>
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}
