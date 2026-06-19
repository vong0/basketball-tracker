import styles from './GamesPage.module.css';
import cardStyles from './GameCard.module.css';

function gameResult(score) {
  if (!score || typeof score !== 'string') return null;
  const parts = score.split('-').map(s => parseInt(s.trim(), 10));
  if (parts.length !== 2 || parts.some(n => Number.isNaN(n))) return null;
  const [us, them] = parts;
  if (us > them) return 'W';
  if (us < them) return 'L';
  return 'T';
}

export default function GameCard({ id, game, onClick, href }) {
  const result = gameResult(game.score);
  const badgeClass =
    result === 'W' ? cardStyles.badgeWin :
    result === 'L' ? cardStyles.badgeLoss :
    cardStyles.badgeTie;

  return (
    <a className={cardStyles.card} href={href} onClick={onClick}>
      <div className={cardStyles.topRow}>
        <span className={cardStyles.id}>#{id}</span>
        {result && (
          <span className={`${cardStyles.badge} ${badgeClass}`}>{result}</span>
        )}
      </div>
      <div className={cardStyles.name}>{game.name || 'Untitled game'}</div>
      {game.opponents && (
        <div className={cardStyles.opponent}>vs {game.opponents}</div>
      )}
      {game.score && (
        <div className={cardStyles.score}>{game.score}</div>
      )}
    </a>
  );
}
