import { useEffect, useState } from 'react';
import { Loader, Center } from '@mantine/core';
import Banner from '../../components/Banner/Banner';
import GameCard from './GameCard';
import { navigate } from '../../lib/routing';
import styles from './GamesPage.module.css';

export default function LandingPage({ isMobile }) {
  const [games, setGames] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('./data/games.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setGames)
      .catch(err => {
        console.error('Could not load games.json:', err);
        setError(String(err));
      });
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <Banner isMobile={isMobile} />
        <div className={styles.errorBox}>Could not load games. ({error})</div>
      </div>
    );
  }

  if (!games) {
    return (
      <div className={styles.page}>
        <Banner isMobile={isMobile} />
        <Center style={{ flex: 1 }}><Loader color="orange" /></Center>
      </div>
    );
  }

  const entries = Object.entries(games).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className={styles.page}>
      <Banner isMobile={isMobile} />
      <div className={styles.scroll}>
        <div className={styles.headingBlock}>
          <div className={styles.kicker}>SEASON</div>
          <div className={styles.headingRow}>
            <h1 className={styles.heading}>Games</h1>
          </div>
          <div className={styles.count}>
            {entries.length} {entries.length === 1 ? 'game' : 'games'}
          </div>
        </div>
        <div className={`${styles.grid} ${isMobile ? styles.gridMobile : ''}`}>
          {entries.map(([id, g]) => (
            <GameCard
              key={id}
              id={id}
              game={g}
              href={"#/game/" + id} onClick={() => navigate('#/game/' + id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
