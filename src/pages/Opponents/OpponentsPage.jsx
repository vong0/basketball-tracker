import { useState, useEffect } from 'react';
import Banner from '../../components/Banner/Banner';
import styles from './OpponentsPage.module.css';

// Resolve photo: supports http/https URLs and repo-relative paths like
// "public/data/photos/foo.jpg" -> "./data/photos/foo.jpg"
function resolvePhoto(photo) {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  // Strip leading "public/" since Vite serves public/ at root
  if (photo.startsWith('public/')) return './' + photo.slice('public/'.length);
  return photo;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ photo, number, size = 88 }) {
  const src = resolvePhoto(photo);
  if (src) {
    return (
      <div
        className={styles.avatarWrap}
        style={{ width: size, height: size, borderRadius: 6, flexShrink: 0 }}
      >
        <img src={src} alt="" className={styles.avatarImg} />
      </div>
    );
  }
  return (
    <div
      className={styles.avatarPlaceholder}
      style={{ width: size, height: size, borderRadius: 6, flexShrink: 0 }}
    >
      #{number}
    </div>
  );
}

// ── Player card ───────────────────────────────────────────────────────────────

function PlayerCard({ player }) {
  const isNoThreat = player.threat.length === 0 && player.defend.length === 0;

  return (
    <div className={`${styles.playerCard} ${isNoThreat ? styles.playerCardDim : ''}`}>
      <div className={styles.playerCardTop}>
        <Avatar photo={player.photo} number={player.number} size={88} />
        <div className={styles.playerMeta}>
          <div className={styles.playerNumber}>
            #{player.number}{player.name ? ` — ${player.name}` : ''}
          </div>
          <p className={styles.playerProfile}>{player.profile}</p>
          {isNoThreat && (
            <span className={styles.noThreatBadge}>No threat — ignore</span>
          )}
        </div>
      </div>

      {!isNoThreat && (
        <div className={styles.playerCardGrid}>
          <div className={styles.threatCol}>
            <div className={styles.threatLabel}>⚠ Threat</div>
            <ul className={styles.bulletList}>
              {player.threat.map((t, i) => (
                <li key={i} className={styles.threatItem}>
                  <span className={styles.threatDot}>*</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.defendCol}>
            <div className={styles.defendLabel}>🛡 Defend</div>
            <ul className={styles.bulletList}>
              {player.defend.map((d, i) => (
                <li key={i} className={styles.defendItem}>
                  <span className={styles.defendArrow}>→</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team detail ───────────────────────────────────────────────────────────────

function TeamDetail({ team, onBack }) {
  const src = resolvePhoto(team.photo);

  return (
    <div className={styles.detailPage}>
      {/* Sticky nav */}
      <div className={styles.detailNav}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Opponents
        </button>
        <span className={styles.detailNavSep}>/</span>
        <span className={styles.detailNavTitle}>{team.name}</span>
      </div>

      {/* Hero banner */}
      <div className={styles.detailHero}>
        {src && (
          <>
            <img src={src} alt="" className={styles.detailHeroImg} />
            <div className={styles.detailHeroOverlay} />
          </>
        )}
        <div className={styles.detailHeroContent}>
          <h1 className={styles.detailHeroName}>{team.name}</h1>
        </div>
      </div>

      {/* Body */}
      <div className={styles.detailBody}>
        {/* Team notes */}
        <div className={styles.notesCard}>
          <div className={styles.notesLabel}>Team Notes</div>
          <ul className={styles.notesList}>
            {team.notes.map((n, i) => (
              <li key={i} className={styles.notesItem}>
                <span className={styles.notesDash}>—</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Players */}
        {team.players.length > 0 && (
          <div>
            <div className={styles.scoutLabel}>
              Scout Report — {team.players.length} players
            </div>
            <div className={styles.playerList}>
              {team.players.map((p, i) => (
                <PlayerCard key={i} player={p} />
              ))}
            </div>
          </div>
        )}
        {team.players.length === 0 && (
          <p className={styles.noPlayers}>No player notes yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Team card (landing grid) ──────────────────────────────────────────────────

function TeamCard({ team, onClick }) {
  const src = resolvePhoto(team.photo);

  return (
    <button className={styles.teamCard} onClick={onClick}>
      <div className={styles.teamCardPhoto}>
        {src && (
          <>
            <img src={src} alt="" className={styles.teamCardImg} />
            <div className={styles.teamCardOverlay} />
          </>
        )}
        {!src && <div className={styles.teamCardNoPhoto} />}
      </div>
      <div className={styles.teamCardInfo}>
        <div className={styles.teamCardName}>{team.name}</div>
        <div className={styles.teamCardMeta}>
          {team.players.length > 0
            ? <span className={styles.teamCardBadge}>{team.players.length} players</span>
            : <span className={styles.teamCardNone}>No players</span>
          }
        </div>
      </div>
    </button>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

function LandingGrid({ teams, onSelect }) {
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.landingGrid}>
      {sorted.map((team) => (
        <TeamCard key={team.id} team={team} onClick={() => onSelect(team.id)} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OpponentsPage({ isMobile }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch('./data/opponents.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch((err) => {
        console.error('Could not load opponents.json:', err);
        setError(String(err));
      });
  }, []);

  const teams = data?.teams ?? [];
  const selectedTeam = selectedId ? teams.find((t) => t.id === selectedId) : null;

  if (selectedTeam) {
    return (
      <div className={styles.page}>
        <Banner isMobile={isMobile} />
        <div className={styles.scroll}>
          <TeamDetail team={selectedTeam} onBack={() => setSelectedId(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Banner isMobile={isMobile} />
      <div className={styles.heroBanner}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>SCOUTING</div>
          <div className={styles.heroRow}>
            <h1 className={styles.heading}>Opponents</h1>
            {teams.length > 0 && (
              <span className={styles.heroCount}>{teams.length} teams</span>
            )}
          </div>
        </div>
      </div>
      <div className={styles.scroll}>
        <div className={styles.inner}>
          {error && <p className={styles.stateMsg}>Could not load opponents. ({error})</p>}
          {!data && !error && <p className={styles.stateMsg}>Loading...</p>}
          {data && teams.length === 0 && (
            <p className={styles.stateMsg}>No opponents added yet.</p>
          )}
          {data && teams.length > 0 && (
            <LandingGrid teams={teams} onSelect={setSelectedId} />
          )}
        </div>
      </div>
    </div>
  );
}
