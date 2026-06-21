import cardStyles from './GameCard.module.css';
import { gameLabel } from '../../lib/backend.js';

export default function GameCard({ game }) {
  const badgeClass =
    game.result === 'W' ? cardStyles.badgeWin :
    game.result === 'L' ? cardStyles.badgeLoss :
    cardStyles.badgeTie;

  const scoreStr = `${game.teamScore}-${game.opponentScore}`;
  const thumbUrl = `https://img.youtube.com/vi/${game.videoId}/maxresdefault.jpg`;

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.thumbWrap}>
        <img
          src={thumbUrl}
          alt={`${gameLabel(game)} thumbnail`}
          className={cardStyles.thumb}
          loading="lazy"
        />
      </div>
      <div className={cardStyles.body}>
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
        <div className={cardStyles.date}>{game.date}</div>
        <div className={cardStyles.actions}>
          <a href={`#/game/${game.id}`} className={cardStyles.clipsLink}>
            ▶ Watch Clips
          </a>
          <a href={`#/games/${game.id}`} className={cardStyles.detailLink}>
            View Details →
          </a>
        </div>
      </div>
    </div>
  );
}
