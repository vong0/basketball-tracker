import { useEffect, useState } from 'react';
import Banner from '../../components/Banner/Banner';
import { navigate } from '../../lib/routing';
import styles from './LandingPage.module.css';

const SECTIONS = [
  {
    id: 'games',
    href: '#/games',
    kicker: 'SEASON',
    title: 'Games',
    description: 'Browse selected game clips.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    accent: 'orange',
  },
  {
    id: 'stats',
    href: './data/stats.html',
    external: true,
    kicker: 'ANALYTICS',
    title: 'Stats',
    description: 'Player statistics for each game.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    accent: 'purple',
  },
  {
    id: 'takeaways',
    href: '#/takeaways',
    kicker: 'FEEDBACK',
    title: 'Takeaways',
    description: 'Key takeaways for each game.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    accent: 'green',
  },
  {
    id: 'strategies',
    href: '#/strategies',
    kicker: 'PLAYBOOK',
    title: 'Strategies',
    description: 'Team plays with film examples.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    accent: 'blue',
  },
  {
    id: 'opponents',
    href: '#/opponents',
    kicker: 'SCOUTING',
    title: 'Opponents',
    description: 'Scouting reports each opposing team.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accent: 'red',
  },
];

function HubCard({ section }) {
  const accentVar = {
    orange: 'var(--orange)',
    green: 'var(--green)',
    red: 'var(--red)',
    blue: '#818cf8',
    purple: '#a78bfa',
  }[section.accent] || 'var(--orange)';

  const Tag = section.external ? 'a' : 'a';
  const extraProps = section.external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      className={styles.card}
      href={section.href}
      style={{ '--accent': accentVar }}
      {...extraProps}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardIcon} style={{ color: accentVar }}>
          {section.icon}
        </div>
        {section.external && (
          <svg className={styles.externalIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        )}
      </div>
      <div className={styles.cardKicker}>{section.kicker}</div>
      <div className={styles.cardTitle}>{section.title}</div>
      <div className={styles.cardDesc}>{section.description}</div>
      <div className={styles.cardArrow} style={{ color: accentVar }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Tag>
  );
}

export default function LandingPage({ isMobile }) {
  return (
    <div className={styles.page}>
      <Banner isMobile={isMobile} />
      <div className={styles.scroll}>
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.kicker}>Basketball Tracker</div>
            <h1 className={styles.heading}>Spartans</h1>
          </div>
        </div>
        <div className={`${styles.grid} ${isMobile ? styles.gridMobile : ''}`}>
          {SECTIONS.map(s => (
            <HubCard key={s.id} section={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
