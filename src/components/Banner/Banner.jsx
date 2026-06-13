import styles from './Banner.module.css';
import { navigate } from '../../lib/routing';

export default function Banner({ isMobile, game }) {
  return (
    <div className={`${styles.banner} ${isMobile ? styles.bannerMobile : ''}`}>
      <button
        className={styles.brand}
        onClick={() => navigate('#/')}
        aria-label="Go to games landing page"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#f59e0b" />
        <path
          d="M2 12 H22 M12 2 V22 M5 5 Q12 12 19 5 M5 19 Q12 12 19 19"
          stroke="#0b0e14"
          strokeWidth="1.5"
          fill="none"
        />
        </svg>
        <span className={styles.wordmark}>SPARTANS</span>
      </button>
      {game && <GameInfo game={game} isMobile={isMobile} />}
    </div>
  );
}

function gameResult(score) {
  if (!score || typeof score !== 'string') return null;
  const parts = score.split('-').map(s => parseInt(s.trim(), 10));
  if (parts.length !== 2 || parts.some(n => Number.isNaN(n))) return null;
  const [us, them] = parts;
  if (us > them) return 'W';
  if (us < them) return 'L';
  return 'T';
}

function GameInfo({ game, isMobile }) {
  const result = gameResult(game.score);
  const resultClass = result === 'W'
    ? styles.resultW
    : result === 'L'
    ? styles.resultL
    : styles.resultT;
  return (
    <>
      <span className={styles.divider} aria-hidden="true" />
      <div className={styles.gameInfo}>
        {game.name && <span>{game.name}</span>}
        {game.score && (
          <>
            <span className={styles.dotSep}>·</span>
            <span>{game.score}</span>
          </>
        )}
        {result && (
          <>
            <span className={styles.dotSep}>·</span>
            <span className={resultClass}>{result}</span>
          </>
        )}
      </div>
    </>
  );
}
