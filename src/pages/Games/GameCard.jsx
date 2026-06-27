import cardStyles from './GameCard.module.css';

export default function GameCard({ game }) {
  const badgeClass =
    game.result === 'W' ? cardStyles.badgeWin :
    game.result === 'L' ? cardStyles.badgeLoss :
    cardStyles.badgeTie;

  const spartansWon = game.result === 'W';
  const thumbUrl = `https://img.youtube.com/vi/${game.videoId}/maxresdefault.jpg`;

  return (
    <div className={cardStyles.card}>
      <a href={`#/game/${game.id}`} className={cardStyles.thumbWrap} aria-label="Watch clips">
        <img
          src={thumbUrl}
          alt="Game thumbnail"
          className={cardStyles.thumb}
          loading="lazy"
        />
        <div className={cardStyles.playOverlay}>
          <div className={cardStyles.playCircle}>
            <div className={cardStyles.playIcon} />
          </div>
        </div>
      </a>

      <div className={cardStyles.body}>
        <div className={cardStyles.topRow}>
          <span className={cardStyles.gameId}>{game.game}</span>
          {game.result && (
            <span className={`${cardStyles.badge} ${badgeClass}`}>{game.result}</span>
          )}
        </div>

        <div className={cardStyles.scoreRow}>
          <div className={cardStyles.teamBlock}>
            <span className={`${cardStyles.scoreNum} ${spartansWon ? '' : cardStyles.scoreNumFaded}`}>
              {game.teamScore}
            </span>
            <span className={cardStyles.teamName}>Spartans</span>
          </div>
          <span className={cardStyles.scoreSep}>–</span>
          <div className={`${cardStyles.teamBlock} ${cardStyles.teamBlockRight}`}>
            <span className={`${cardStyles.scoreNum} ${spartansWon ? cardStyles.scoreNumFaded : ''}`}>
              {game.opponentScore}
            </span>
            <span className={cardStyles.teamName}>{game.opponentName ?? 'Opponent'}</span>
          </div>
        </div>

        <div className={cardStyles.date}>{game.date}</div>

        <a href={`#/games/${game.id}`} className={cardStyles.overviewBtn}>
          Overview
        </a>
      </div>
    </div>
  );
}
