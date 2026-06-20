// @refresh reset
import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import ControlBar from './ControlBar';
import MobileBlockers from './MobileBlockers';
import ClipInfoModal from './ClipInfoModal';
import NeighborSlots from './NeighborSlots';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useSegmentLoop } from './hooks/useSegmentLoop';
import { useSeekDrag } from './hooks/useSeekDrag';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { useModalPlayback } from './hooks/useModalPlayback';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { LOOP_LEAD } from './constants';
import styles from './VideoPlayer.module.css';

function VideoPlayerInner({
  videoId, cutSegments, parsedSegments, activeIdx, setActiveIdx,
  visibleIndices, isFullscreen, setIsFullscreen, isMobile, hideCounter,
}, ref) {
  const containerRef = useRef(null);
  const seekbarRef = useRef(null);
  const reelRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);

  const { ytPlayerRef, playerReady, isPlaying, initialLoading, currentRate, setRate,
    iframeContainerRef, iframeScaleWrapRef } = useYouTubePlayer({ videoId, isMobile, isFullscreen });

  const activeSegment = activeIdx >= 0 ? cutSegments[activeIdx] : null;

  const { currentTime, setCurrentTime, isDraggingRef } = useSegmentLoop({
    ytPlayerRef, playerReady, activeIdx, activeSegment,
  });

  const navList = visibleIndices ?? cutSegments.map((_, i) => i);

  const playSegment = useCallback((idx) => {
    if (idx < 0 || idx >= cutSegments.length) return;
    setActiveIdx(idx);
  }, [cutSegments, setActiveIdx]);

  const togglePlay = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (activeIdx < 0) { playSegment(0); return; }
    if (isPlaying) {
      try { p.pauseVideo(); } catch (e) {}
    } else {
      if (activeSegment && currentTime >= activeSegment.end - 0.05) {
        try { p.seekTo(activeSegment.start, true); } catch (e) {}
      }
      try { p.playVideo(); } catch (e) {}
    }
  }, [isPlaying, activeIdx, currentTime, activeSegment, playSegment, ytPlayerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const seekDelta = useCallback((delta) => {
    const p = ytPlayerRef.current;
    if (!p || !p.getCurrentTime) return;
    const t = p.getCurrentTime();
    let nt = t + delta;
    if (activeSegment) nt = Math.max(activeSegment.start, Math.min(activeSegment.end, nt));
    try { p.seekTo(nt, true); } catch (e) {}
  }, [activeSegment, ytPlayerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const navSegment = useCallback((dir) => {
    if (navList.length === 0) return;
    let pos = navList.indexOf(activeIdx);
    if (pos === -1) {
      if (dir > 0) {
        const found = navList.findIndex(i => i > activeIdx);
        pos = found === -1 ? navList.length - 1 : found - 1;
      } else {
        const found = [...navList].reverse().findIndex(i => i < activeIdx);
        const idxInOrig = found === -1 ? 0 : navList.length - 1 - found;
        pos = idxInOrig + 1;
      }
    }
    const nextPos = Math.max(0, Math.min(navList.length - 1, pos + dir));
    const nextIdx = navList[nextPos];
    if (nextIdx !== activeIdx) playSegment(nextIdx);
  }, [activeIdx, navList, playSegment]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        const req = containerRef.current.requestFullscreen?.();
        if (req && req.then) await req;
        if (isMobile && screen.orientation && screen.orientation.lock) {
          try { await screen.orientation.lock('landscape'); } catch (e) {}
        }
      } catch (e) {}
    } else {
      try {
        if (screen.orientation && screen.orientation.unlock) {
          try { screen.orientation.unlock(); } catch (e) {}
        }
        await document.exitFullscreen?.();
      } catch (e) {}
    }
  }, [isMobile]);

  const { pauseAndRemember, resumeIfWasPlaying, modalSuppressPlayRef } = useModalPlayback({
    ytPlayerRef, isPlaying,
  });

  const handleOpenInfo = useCallback(() => { pauseAndRemember(); setShowInfo(true); }, [pauseAndRemember]);
  const handleCloseInfo = useCallback(() => { setShowInfo(false); resumeIfWasPlaying(); }, [resumeIfWasPlaying]);

  const { makePointerDownHandler, isDragging } = useSeekDrag({
    activeSegment, isPlaying, ytPlayerRef, setCurrentTime, isDraggingRef,
  });

  const { swipeWrapRef, swipeHandlers, endLongPress } = useSwipeGesture({
    isMobile, activeIdx, navList, setActiveIdx, setRate, togglePlay,
  });

  const { handleTapZoneClick, handleTapZoneDoubleClick, resetSpeedKeys } = useKeyboardShortcuts({
    isMobile, togglePlay, seekDelta, navSegment, toggleFullscreen, setRate,
    showInfo, handleOpenInfo, handleCloseInfo, cutSegmentsLength: cutSegments.length,
  });

  // Seek to segment when activeIdx changes, auto-play unless a modal is suppressing it.
  useEffect(() => {
    if (!playerReady || activeIdx < 0) return;
    const seg = cutSegments[activeIdx];
    if (!seg) return;
    const p = ytPlayerRef.current;
    if (!p || !p.seekTo) return;
    try {
      p.seekTo(seg.start, true);
      if (!modalSuppressPlayRef.current) p.playVideo();
    } catch (e) {}
  }, [activeIdx, playerReady, cutSegments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause when no clip is selected (e.g. filter matched zero clips).
  useEffect(() => {
    if (!playerReady || activeIdx >= 0) return;
    const p = ytPlayerRef.current;
    if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
  }, [activeIdx, playerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setIsFullscreen]);

  // Reset speed keys and long-press when window loses focus or tab is hidden.
  useEffect(() => {
    const reset = () => { resetSpeedKeys(); endLongPress(); };
    const onVis = () => { if (document.hidden) reset(); };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [resetSpeedKeys, endLongPress]);

  useImperativeHandle(ref, () => ({ pauseAndRemember, resumeIfWasPlaying }), [pauseAndRemember, resumeIfWasPlaying]);

  // Derived values
  const segDuration = activeSegment ? activeSegment.end - activeSegment.start : 1;
  const visibleDuration = activeSegment ? Math.max(0.01, segDuration - LOOP_LEAD) : 1;
  const segProgress = activeSegment
    ? Math.max(0, Math.min(1, (currentTime - activeSegment.start) / visibleDuration))
    : 0;
  const useFsMobileChrome = isMobile && isFullscreen;
  const activeParsed = parsedSegments && activeIdx >= 0 ? parsedSegments[activeIdx] : null;
  const counterDotClass = activeParsed?.team === 'opponent' ? styles.dotOpponent
    : activeParsed?.quality === 'good' ? styles.dotGood
    : activeParsed?.quality === 'bad' ? styles.dotBad
    : styles.dotNeutral;
  const navPos = navList.indexOf(activeIdx);
  const handleSeekbarPointerDown = makePointerDownHandler(seekbarRef);
  const handleReelPointerDown = makePointerDownHandler(reelRef);

  return (
    <div ref={containerRef} className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.videoArea}>
        {isMobile ? (
          <div ref={swipeWrapRef} className={styles.swipeWrap}>
            <NeighborSlots activeIdx={activeIdx} cutSegmentsLength={cutSegments.length}>
              <div className={styles.videoSlot}>
                <div ref={iframeContainerRef} className={styles.iframeContainerMobile}>
                  <div ref={iframeScaleWrapRef} className={styles.iframeScaleWrap} />
                </div>
                {initialLoading && <div className={styles.iframeLoadBlocker} />}
              </div>
            </NeighborSlots>
          </div>
        ) : (
          <div ref={iframeContainerRef} className={styles.iframeContainer} />
        )}

        {currentRate !== 1 && <div className={styles.speedBadge}>{currentRate}×</div>}

        {isMobile ? (
          <MobileBlockers swipeHandlers={swipeHandlers} isFullscreen={isFullscreen} />
        ) : (
          <div
            className={styles.tapZone}
            onClick={handleTapZoneClick}
            onDoubleClick={handleTapZoneDoubleClick}
          />
        )}

        {!hideCounter && navList.length > 0 && activeIdx >= 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenInfo(); }}
            className={styles.fsTopCounter}
            aria-label="Clip info"
          >
            <span className={`${styles.fsTopCounterDot} ${counterDotClass}`} />
            <span>{navPos === -1 ? 1 : navPos + 1}/{navList.length}</span>
          </button>
        )}

        {activeIdx < 0 && (
          <div className={styles.emptyOverlay}>
            <div className={styles.emptyOverlayInner}>
              <div className={styles.emptyOverlayTitle}>No clip selected</div>
              <div className={styles.emptyOverlaySub}>No clips match the current filter.</div>
            </div>
          </div>
        )}
      </div>

      {useFsMobileChrome && activeSegment && (
        <div ref={reelRef} className={styles.reelSeekbar} onPointerDown={handleReelPointerDown}>
          <div className={styles.reelSeekbarFill} style={{ width: (segProgress * 100) + '%' }} />
        </div>
      )}

      {useFsMobileChrome && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className={styles.fsBottomExpandBtn}
          aria-label="Exit fullscreen"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 4 9 9 4 9" />
            <polyline points="15 4 15 9 20 9" />
            <polyline points="9 20 9 15 4 15" />
            <polyline points="15 20 15 15 20 15" />
          </svg>
        </button>
      )}

      {!useFsMobileChrome && (
        <ControlBar
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          segProgress={segProgress}
          isDragging={isDragging}
          seekbarRef={seekbarRef}
          onSeekbarPointerDown={handleSeekbarPointerDown}
          onToggleFullscreen={toggleFullscreen}
          disabled={!activeSegment}
        />
      )}

      <ClipInfoModal
        opened={showInfo}
        onClose={handleCloseInfo}
        activeSegment={activeSegment}
        activeParsed={activeParsed}
        navList={navList}
        activeIdx={activeIdx}
      />
    </div>
  );
}

VideoPlayerInner.displayName = 'VideoPlayer';
const VideoPlayer = forwardRef(VideoPlayerInner);
export default VideoPlayer;
