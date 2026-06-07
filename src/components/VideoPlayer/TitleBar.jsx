import styles from './VideoPlayer.module.css';

export default function TitleBar({ counterText, qualityDot, title, visible, onHelp }) {
  return (
    <div className={`${styles.titleBar} ${visible ? '' : styles.faded}`}>
      <span className={styles.titleCounter}>{counterText}</span>
      <span>{qualityDot}</span>
      <span className={styles.titleText}>{title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onHelp(); }}
        className={styles.helpBtn}
      >
        ?
      </button>
    </div>
  );
}
