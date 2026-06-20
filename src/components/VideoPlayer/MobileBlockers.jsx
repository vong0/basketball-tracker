import styles from './VideoPlayer.module.css';

function Blocker({ className, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }) {
  return (
    <div
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
    />
  );
}

export default function MobileBlockers({ swipeHandlers, isFullscreen }) {
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = swipeHandlers;
  const shared = { onPointerMove, onPointerUp, onPointerCancel };

  return (
    <>
      {/* Top blocker kills the "Watch on YouTube" link */}
      <div className={styles.ytTopBlocker} />
      {/* Bottom blocker kills YT seekbar; side is 'right' so long-press = 2x */}
      <Blocker className={styles.ytBottomBlocker} onPointerDown={onPointerDown('right')} {...shared} />
      <Blocker className={styles.ytLeftBlocker}   onPointerDown={onPointerDown('left')}  {...shared} />
      <Blocker className={styles.ytRightBlocker}  onPointerDown={onPointerDown('right')} {...shared} />
      <Blocker className={styles.ytLowerLeftBlocker}  onPointerDown={onPointerDown('left')}  {...shared} />
      <Blocker className={styles.ytLowerRightBlocker} onPointerDown={onPointerDown('right')} {...shared} />
      {/* Non-fullscreen: close the center gap left by the lower left/right blockers.
          Split into two halves so left/right long-press semantics stay consistent. */}
      {!isFullscreen && (
        <>
          <Blocker className={styles.ytLowerCenterLeftBlocker}  onPointerDown={onPointerDown('left')}  {...shared} />
          <Blocker className={styles.ytLowerCenterRightBlocker} onPointerDown={onPointerDown('right')} {...shared} />
        </>
      )}
    </>
  );
}
