import { useState, useEffect } from 'react';
import Banner from '../../components/Banner/Banner';
import { getGames, getGameTakeaways } from '../../lib/backend.js';
import styles from './TakeawaysPage.module.css';

function PlayerCard({ player }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`${styles.card} ${open ? styles.cardOpen : ''}`}>
      <button
        className={styles.cardHeader}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={styles.playerName}>{player.name}</span>
        <div className={styles.headerRight}>
          {player.strengths.length > 0 && (
            <span className={styles.badgeStr}>
              {player.strengths.length} STR
            </span>
          )}
          {player.improvements.length > 0 && (
            <span className={styles.badgeImp}>
              {player.improvements.length} IMP
            </span>
          )}
          <svg
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className={styles.cardBody}>
          <div className={styles.divider} />
          <div className={styles.columns}>
            {player.strengths.length > 0 && (
              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <div className={styles.accentGreen} />
                  <span className={`${styles.columnLabel} ${styles.labelGreen}`}>
                    Strengths
                  </span>
                </div>
                <ul className={styles.list}>
                  {player.strengths.map((s, i) => (
                    <li key={i} className={styles.listItem}>
                      <span className={styles.bulletGreen} aria-hidden="true">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {player.improvements.length > 0 && (
              <div className={styles.column}>
                <div className={styles.columnHeader}>
                  <div className={styles.accentOrange} />
                  <span className={`${styles.columnLabel} ${styles.labelOrange}`}>
                    Areas to Improve
                  </span>
                </div>
                <ul className={styles.list}>
                  {player.improvements.map((s, i) => (
                    <li key={i} className={styles.listItem}>
                      <span className={styles.bulletOrange} aria-hidden="true">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GameSection({ game, takeaways, forceState }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceState !== null) setOpen(forceState);
  }, [forceState]);

  const players = takeaways?.players ?? [];
  if (players.length === 0) return null;

  return (
    <div className={styles.gameSection}>
      <button
        className={styles.gameHeader}
        onClick={() => setOpen(o => !o)}
      >
        <div className={styles.gameHeaderLeft}>
          <span className={styles.gameTitle}>{game.game}</span>
          {game.opponentName && (
            <span className={styles.gameOpponent}>vs {game.opponentName}</span>
          )}
        </div>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={styles.playerList}>
          {players.map((p, i) => (
            <PlayerCard key={i} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TakeawaysPage({ isMobile }) {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [forceState, setForceState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const games = await getGames();
        const takeawaysList = await Promise.all(games.map(g => getGameTakeaways(g.id)));
        if (cancelled) return;
        const combined = games
          .map((g, i) => ({ game: g, takeaways: takeawaysList[i] }))
          .filter(({ takeaways }) => takeaways?.players?.length > 0);
        setEntries(combined);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.page}>
      <Banner isMobile={isMobile} />

      <div className={styles.heroBanner}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>SEASON</div>
          <div className={styles.heroRow}>
            <h1 className={styles.heading}>Player Takeaways</h1>
            <button
              className={styles.toggleBtn}
              onClick={() => setForceState(s => !s)}
            >
              {forceState ? '↑ Collapse All' : '↓ Expand All'}
            </button>
          </div>
          <p className={styles.sub}>
            Tap a player to expand their feedback.
          </p>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.inner}>
          {error && (
            <p className={styles.error}>Could not load takeaways. ({error})</p>
          )}
          {!entries && !error && (
            <p className={styles.loading}>Loading...</p>
          )}
          {entries && entries.map(({ game, takeaways }) => (
            <GameSection
              key={game.id}
              game={game}
              takeaways={takeaways}
              forceState={forceState}
            />
          ))}
          {entries && entries.length === 0 && (
            <p className={styles.empty}>No takeaways recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
