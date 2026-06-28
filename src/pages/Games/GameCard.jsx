import cardStyles from './GameCard.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

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
          <span className={`${cardStyles.scoreNum} ${spartansWon ? '' : cardStyles.scoreNumFaded}`}>
            {game.teamScore}
          </span>
          <span className={cardStyles.scoreSep}>–</span>
          <span className={`${cardStyles.scoreNum} ${spartansWon ? cardStyles.scoreNumFaded : ''}`}>
            {game.opponentScore}
          </span>
        </div>

        <div className={cardStyles.teamNamesRow}>
          <span className={`${cardStyles.teamName} ${spartansWon ? cardStyles.teamNameWinner : ''}`}>
            Spartans
          </span>
          <span className={cardStyles.teamSep}>|</span>
          <span className={`${cardStyles.teamName} ${spartansWon ? '' : cardStyles.teamNameWinner}`}>
            {game.opponentName ?? 'Opponent'}
          </span>
        </div>

        <div className={cardStyles.date}>{formatDate(game.date)}</div>

        <a href={`#/games/${game.id}`} className={cardStyles.overviewBtn}>
          OVERVIEW
        </a>
      </div>
    </div>
  );
}
