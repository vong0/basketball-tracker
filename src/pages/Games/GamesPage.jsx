import { useEffect, useState } from 'react';
import { Loader, Center } from '@mantine/core';
import Banner from '../../components/Banner/Banner';
import GameCard from './GameCard';
import { navigate } from '../../lib/routing';
import { getGames } from '../../lib/backend.js';
import styles from './GamesPage.module.css';

export default function LandingPage() {
  const [games, setGames] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getGames();
        if (!cancelled) setGames(data);
      } catch (err) {
        if (!cancelled) {
          console.error('Could not load games:', err);
          setError(String(err));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <Banner />
        <div className={styles.errorBox}>Could not load games. ({error})</div>
      </div>
    );
  }

  if (!games) {
    return (
      <div className={styles.page}>
        <Banner />
        <Center style={{ flex: 1 }}><Loader color="orange" /></Center>
      </div>
    );
  }

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
        <div className={styles.grid}>
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              href={"#/game/" + game.id}
              onClick={() => navigate('#/game/' + game.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
