import styles from './Banner.module.css';

export default function Banner({ isMobile }) {
  return (
    <div className={`${styles.banner} ${isMobile ? styles.bannerMobile : ''}`}>
      <div className={styles.brand}>
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
      </div>
      <nav className={styles.nav}>
        <button className={`${styles.tab} ${styles.active}`}>Games</button>
      </nav>
    </div>
  );
}
