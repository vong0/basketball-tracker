import styles from './GamesPage.module.css';
import cardStyles from './GameCard.module.css';
import { gameLabel } from '../../lib/backend.js';

export default function GameCard({ game, onClick, href }) {
  const badgeClass =
    game.result === 'W' ? cardStyles.badgeWin :
    game.result === 'L' ? cardStyles.badgeLoss :
    cardStyles.badgeTie;

  const scoreStr = `${game.teamScore}-${game.opponentScore}`;

  return (
    <a className={cardStyles.card} href={href} onClick={onClick}>
      <div className={cardStyles.topRow}>
        <span className={cardStyles.id}>#{game.game}</span>
        {game.result && (
          <span className={`${cardStyles.badge} ${badgeClass}`}>{game.result}</span>
        )}
      </div>
      <div className={cardStyles.name}>{gameLabel(game)}</div>
      {game.opponentName && (
        <div className={cardStyles.opponent}>vs {game.opponentName}</div>
      )}
      <div className={cardStyles.score}>{scoreStr}</div>
    </a>
  );
}
