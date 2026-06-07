import styles from './VideoPlayer.module.css';

export default function SpeedIndicator({ rate }) {
  if (!rate) return null;
  return <div className={styles.speedPill}>{rate}×</div>;
}
