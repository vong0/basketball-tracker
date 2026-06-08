import { useState, useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '../../lib/youtube';
import ControlBar from './ControlBar';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer({
  videoId,
  cutSegments,
  activeIdx,
  setActiveIdx,
  isFullscreen,
  setIsFullscreen,
  isMobile
}) {
  const ytPlayerRef = useRef(null);
  const containerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const iframeScaleWrapRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentRate, setCurrentRate] = useState(1);
  const tickRef = useRef(null);
  const speedKeyRef = useRef({ shift: false, ctrl: false });
  const longPressRef = useRef({ timer: null, active: false, side: null });
  const lastTapRef = useRef({ time: 0, side: null });
  const clickTimerRef = useRef(null);
  const seekThrottleRef = useRef(0);
  const isDraggingRef = useRef(false);

  const activeSegment = activeIdx >= 0 ? cutSegments[activeIdx] : null;

  // YouTube setup
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      const div = document.createElement('div');
      div.id = 'yt-player-' + Math.random().toString(36).slice(2);
      // On mobile, mount inside the scale wrapper so the 1920x1080 iframe
      // gets scaled. On desktop, mount directly in the container.
      const mountTarget = (isMobile && iframeScaleWrapRef.current)
        ? iframeScaleWrapRef.current
        : iframeContainerRef.current;
      if (mountTarget) {
        mountTarget.innerHTML = '';
        mountTarget.appendChild(div);
        // Force iframe to fill the wrapper after YT creates it.
        // YT sets width/height HTML attributes (640x360) that override CSS.
        const forceSize = () => {
          const iframe = mountTarget.querySelector('iframe');
          if (iframe) {
            if (isMobile) {
              iframe.setAttribute('width', '1920');
              iframe.setAttribute('height', '1080');
              iframe.style.width = '1920px';
              iframe.style.height = '1080px';
            } else {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
            }
          }
        };
        // Run now and after a tick — YT may set attrs after onReady
        forceSize();
        setTimeout(forceSize, 0);
        setTimeout(forceSize, 300);
      }
      ytPlayerRef.current = new YT.Player(div.id, {
        videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          playsinline: 1,
          vq: 'hd1080'
        },
        events: {
          onReady: (e) => {
            setPlayerReady(true);
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              setIsPlaying(true);
            } else if (e.data === 2 || e.data === 0) {
              setIsPlaying(false);
            }
          }
        }
      });
    });
    return () => {
      cancelled = true;
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
      }
    };
  }, [videoId]);

  const setRate = useCallback((rate) => {
    const p = ytPlayerRef.current;
    if (!p || !p.setPlaybackRate) return;
    try { p.setPlaybackRate(rate); } catch (e) {}
    setCurrentRate(rate);
  }, []);

  // Tick: poll currentTime + always loop at segment end
  useEffect(() => {
    if (!playerReady) return;
    tickRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime();
      if (!isDraggingRef.current) setCurrentTime(t);
      if (activeSegment && t >= activeSegment.end - 0.2 && t > activeSegment.start + 0.5) {
        try { p.seekTo(activeSegment.start, true); } catch (e) {}
      }
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [playerReady, activeIdx, activeSegment]);

  // Seek to active segment when it changes
  useEffect(() => {
    if (!playerReady || activeIdx < 0) return;
    const seg = cutSegments[activeIdx];
    if (!seg) return;
    const p = ytPlayerRef.current;
    if (!p || !p.seekTo) return;
    try {
      p.seekTo(seg.start, true);
      p.playVideo();
    } catch (e) {}
  }, [activeIdx, playerReady, cutSegments]);

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
  }, [isPlaying, activeIdx, currentTime, activeSegment, playSegment]);

  const seekDelta = useCallback((delta) => {
    const p = ytPlayerRef.current;
    if (!p || !p.getCurrentTime) return;
    const t = p.getCurrentTime();
    let nt = t + delta;
    if (activeSegment) nt = Math.max(activeSegment.start, Math.min(activeSegment.end, nt));
    try { p.seekTo(nt, true); } catch (e) {}
  }, [activeSegment]);

  const navSegment = useCallback((dir) => {
    const cur = activeIdx;
    const next = cur < 0 ? 0 : Math.max(0, Math.min(cutSegments.length - 1, cur + dir));
    if (next !== cur || cur < 0) playSegment(next);
  }, [activeIdx, cutSegments.length, playSegment]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Debounced single-click — cancelled by double-click (desktop)
  const handleTapZoneClick = useCallback(() => {
    if (clickTimerRef.current) return;
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      togglePlay();
    }, 250);
  }, [togglePlay]);

  const handleTapZoneDoubleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    toggleFullscreen();
  }, [toggleFullscreen]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setIsFullscreen]);

  // Mobile only: scale the 1920x1080 iframe to COVER the container.
  // Tricks YouTube into serving HD because it sees a "large" player,
  // and crops overflow so video fills edge-to-edge.
  useEffect(() => {
    if (!isMobile) return;
    const recompute = () => {
      const wrap = iframeScaleWrapRef.current;
      const container = iframeContainerRef.current;
      if (!wrap || !container) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;
      // COVER: pick the LARGER scale so iframe fills container in both axes
      const scale = Math.max(cw / 1920, ch / 1080);
      const scaledW = 1920 * scale;
      const scaledH = 1080 * scale;
      // Center: with cover, scaledW >= cw and scaledH >= ch, so offsets
      // are <= 0, shifting the wrapper to center the overflow.
      wrap.style.transform = 'scale(' + scale + ')';
      wrap.style.left = ((cw - scaledW) / 2) + 'px';
      wrap.style.top = ((ch - scaledH) / 2) + 'px';
      // Also force iframe size in case YT reset it
      const iframe = wrap.querySelector('iframe');
      if (iframe) {
        iframe.setAttribute('width', '1920');
        iframe.setAttribute('height', '1080');
        iframe.style.width = '1920px';
        iframe.style.height = '1080px';
      }
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (iframeContainerRef.current) ro.observe(iframeContainerRef.current);
    window.addEventListener('resize', recompute);
    document.addEventListener('fullscreenchange', recompute);
    // Multiple recomputes — fullscreen + iframe load both settle late
    const t1 = setTimeout(recompute, 100);
    const t2 = setTimeout(recompute, 500);
    const t3 = setTimeout(recompute, 1000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
      document.removeEventListener('fullscreenchange', recompute);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMobile, isFullscreen, playerReady]);

  // Reset speed on blur / tab hidden
  useEffect(() => {
    const reset = () => {
      if (speedKeyRef.current.shift || speedKeyRef.current.ctrl) {
        speedKeyRef.current = { shift: false, ctrl: false };
        setRate(1);
      }
      if (longPressRef.current.active) {
        if (longPressRef.current.timer) clearTimeout(longPressRef.current.timer);
        longPressRef.current = { timer: null, active: false, side: null };
        setRate(1);
      }
    };
    const onVis = () => { if (document.hidden) reset(); };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [setRate]);

  // Keyboard shortcuts (desktop)
  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen?.();
        return;
      }
      if (e.key === 'Shift' && !speedKeyRef.current.shift) {
        speedKeyRef.current.shift = true; setRate(2); return;
      }
      if (e.key === 'Control' && !speedKeyRef.current.ctrl) {
        speedKeyRef.current.ctrl = true; setRate(0.5); return;
      }
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); seekDelta(-1); break;
        case 'ArrowRight': e.preventDefault(); seekDelta(1); break;
        case 'j': case 'J': e.preventDefault(); navSegment(-1); break;
        case 'k': case 'K': e.preventDefault(); navSegment(1); break;
        case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift' && speedKeyRef.current.shift) { speedKeyRef.current.shift = false; setRate(1); }
      if (e.key === 'Control' && speedKeyRef.current.ctrl) { speedKeyRef.current.ctrl = false; setRate(1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile, togglePlay, seekDelta, navSegment, toggleFullscreen, setRate]);

  // Mobile side-blocker gesture handlers
  const onSideBlockerPointerDown = (side) => () => {
    if (!isMobile) return;
    longPressRef.current.timer = setTimeout(() => {
      longPressRef.current.active = true;
      longPressRef.current.side = side;
      setRate(side === 'left' ? 0.5 : 2);
    }, 500);
  };

  const endLongPress = useCallback(() => {
    if (!isMobile) return false;
    if (longPressRef.current.timer) clearTimeout(longPressRef.current.timer);
    if (longPressRef.current.active) {
      longPressRef.current.timer = null;
      longPressRef.current.active = false;
      longPressRef.current.side = null;
      setRate(1);
      return true;
    }
    longPressRef.current.timer = null;
    return false;
  }, [isMobile, setRate]);

  const onSideBlockerPointerUp = (side) => () => {
    if (!isMobile) return;
    if (endLongPress()) return;
    const now = Date.now();
    if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
      // Double-tap: skip ±1s. Cancel the pending single-tap pause.
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      seekDelta(side === 'left' ? -1 : 1);
      lastTapRef.current.time = 0;
    } else {
      lastTapRef.current = { time: now, side };
      // Single tap → pause/play (debounced ~300ms to allow double-tap detection).
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        togglePlay();
      }, 300);
    }
  };

  const onSideBlockerPointerCancel = () => endLongPress();

  // Seekbar
  const seekbarRef = useRef(null);
  const reelRef = useRef(null);
  // Compute new time from pointer event without seeking — for thumb updates
  const computeSeekTime = useCallback((e, ref) => {
    const node = ref?.current || seekbarRef.current;
    if (!node || !activeSegment) return null;
    const rect = node.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return null;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const duration = activeSegment.end - activeSegment.start;
    return activeSegment.start + pct * duration;
  }, [activeSegment]);

  // Throttled seek — visual thumb is always immediate, YT seekTo is rate-limited
  const handleSeekbarMove = useCallback((e, ref) => {
    const newTime = computeSeekTime(e, ref);
    if (newTime === null) return;
    setCurrentTime(newTime); // immediate visual update
    const now = performance.now();
    if (now - seekThrottleRef.current >= 50) {
      seekThrottleRef.current = now;
      const p = ytPlayerRef.current;
      if (p && p.seekTo) try { p.seekTo(newTime, true); } catch (err) {}
    }
  }, [computeSeekTime]);

  const handleSeekbarPointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    seekThrottleRef.current = 0; // force first seek to fire immediately
    handleSeekbarMove(e, seekbarRef);
    const onMove = (ev) => handleSeekbarMove(ev, seekbarRef);
    const onUp = (ev) => {
      // Final seek to exact landing position (un-throttled)
      const finalTime = computeSeekTime(ev, seekbarRef);
      if (finalTime !== null) {
        setCurrentTime(finalTime);
        const p = ytPlayerRef.current;
        if (p && p.seekTo) try { p.seekTo(finalTime, true); } catch (err) {}
      }
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleReelPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    seekThrottleRef.current = 0;
    handleSeekbarMove(e, reelRef);
    const onMove = (ev) => handleSeekbarMove(ev, reelRef);
    const onUp = (ev) => {
      const finalTime = computeSeekTime(ev, reelRef);
      if (finalTime !== null) {
        setCurrentTime(finalTime);
        const p = ytPlayerRef.current;
        if (p && p.seekTo) try { p.seekTo(finalTime, true); } catch (err) {}
      }
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const segDuration = activeSegment ? activeSegment.end - activeSegment.start : 1;
  const segProgress = activeSegment
    ? Math.max(0, Math.min(1, (currentTime - activeSegment.start) / segDuration))
    : 0;

  const showReel = isMobile && isFullscreen;
  const showStandardBar = !showReel;

  return (
    <div ref={containerRef} className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.videoArea}>
        {isMobile ? (
          <div ref={iframeContainerRef} className={styles.iframeContainerMobile}>
            <div ref={iframeScaleWrapRef} className={styles.iframeScaleWrap} />
          </div>
        ) : (
          <div ref={iframeContainerRef} className={styles.iframeContainer} />
        )}

        {currentRate !== 1 && (
          <div className={styles.speedBadge}>{currentRate}×</div>
        )}

        {isMobile ? (
          <>
            {/* Top blocker - kills accidentally going to full Youtube video */}
            <div className={styles.ytTopBlocker} />
            {/* Bottom blocker — kills YT seekbar drag/tap */}
            <div className={styles.ytBottomBlocker} />
            {/* Left side — gesture zone (double-tap skip, long-press speed). Single tap absorbed. */}
            <div
              className={styles.ytLeftBlocker}
              onPointerDown={onSideBlockerPointerDown('left')}
              onPointerUp={onSideBlockerPointerUp('left')}
              onPointerCancel={onSideBlockerPointerCancel}
              onPointerLeave={onSideBlockerPointerCancel}
            />
            {/* Right side — gesture zone */}
            <div
              className={styles.ytRightBlocker}
              onPointerDown={onSideBlockerPointerDown('right')}
              onPointerUp={onSideBlockerPointerUp('right')}
              onPointerCancel={onSideBlockerPointerCancel}
              onPointerLeave={onSideBlockerPointerCancel}
            />
            {/* Center is open — taps fall through to YT for native play/pause */}
          </>
        ) : (
          <div
            className={styles.tapZone}
            onClick={handleTapZoneClick}
            onDoubleClick={handleTapZoneDoubleClick}
          />
        )}

        {isMobile && isFullscreen && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className={styles.fsExpandBtn}
          >
            ⛶
          </button>
        )}
      </div>

      {showReel && activeSegment && (
        <div ref={reelRef} className={styles.reelSeekbar} onPointerDown={handleReelPointerDown}>
          <div className={styles.reelSeekbarFill} style={{ width: (segProgress * 100) + '%' }} />
        </div>
      )}

      {showStandardBar && (
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
    </div>
  );
}
