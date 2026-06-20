import styles from './Banner.module.css';

export default function Banner({ game }) {
  return (
    <div className={styles.banner}>
      <a className={styles.brand} href="#/" aria-label="Go to games landing page">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ff5c1a" />
          <path
            d="M2 12 H22 M12 2 V22 M5 5 Q12 12 19 5 M5 19 Q12 12 19 19"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <span className={styles.wordmark}>SPARTANS</span>
      </a>
      {game && <GameInfo game={game} />}
    </div>
  );
}

function deriveResult(teamScore, opponentScore) {
  if (teamScore > opponentScore) return 'W';
  if (teamScore < opponentScore) return 'L';
  return 'T';
}

function GameInfo({ game }) {
  const result = deriveResult(game.teamScore, game.opponentScore);
  const resultClass = result === 'W'
    ? styles.resultW
    : result === 'L'
    ? styles.resultL
    : styles.resultT;
  const scoreStr = `${game.teamScore}-${game.opponentScore}`;
  return (
    <>
      <span className={styles.divider} aria-hidden="true" />
      <div className={styles.gameInfo}>
        {game.game && <span>{game.game}</span>}
        <span className={styles.dotSep}>·</span>
        <span>{scoreStr}</span>
        <span className={styles.dotSep}>·</span>
        <span className={resultClass}>{result}</span>
      </div>
    </>
  );
}
