import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@mantine/core';
import { loadYouTubeAPI } from '../../lib/youtube';
import { formatTime } from '../../lib/time';
import { parseLabel } from '../../lib/parseLabel';
import ControlBar from './ControlBar';
import styles from './VideoPlayer.module.css';

// How many seconds before segment.end the loop fires. Used by both the
// tick-based loop trigger and the seekbar progress rescale so the bar
// reaches 100% exactly when the loop kicks in.
const LOOP_LEAD = 0.2;

export default function VideoPlayer({
  videoId,
  cutSegments,
  parsedSegments,
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
  const [showInfo, setShowInfo] = useState(false);
  const tickRef = useRef(null);
  const speedKeyRef = useRef({ shift: false, ctrl: false });
  const longPressRef = useRef({ timer: null, active: false, side: null });
  const clickTimerRef = useRef(null);
  const seekThrottleRef = useRef(0);
  const isDraggingRef = useRef(false);
  const swipeWrapRef = useRef(null);
  const swipeStateRef = useRef({
    pointerDown: false,
    startX: 0,
    startY: 0,
    dx: 0,
    swiping: false,
    side: null,
  });

  const activeSegment = activeIdx >= 0 ? cutSegments[activeIdx] : null;

  // Swipe gesture tuning (mobile only)
  const SWIPE_COMMIT_PX = 80;        // horizontal travel to commit a segment change
  const SWIPE_MOVE_THRESHOLD_PX = 10; // movement that promotes pointerdown -> swipe
  const SWIPE_EDGE_RESIST = 0.15;    // drag follows finger at 15% past first/last
  const SWIPE_EDGE_CAP_PX = 60;      // hard cap on edge drag distance
  const SWIPE_SNAP_MS = 250;         // snap-back animation duration
  const SWIPE_COMMIT_MS = 280;       // slide-off animation duration on commit
  const SWIPE_NEIGHBOR_GAP_PX = 24;  // gap between video and neighbor placeholder

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
        // Run now and after a tick - YT may set attrs after onReady
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
        ytPlayerRef.current = null;
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
      if (activeSegment && t >= activeSegment.end - LOOP_LEAD && t > activeSegment.start + 0.5) {
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

  // Debounced single-click - cancelled by double-click (desktop)
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
    // Multiple recomputes - fullscreen + iframe load both settle late
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
      if (longPressRef.current.timer) {
        clearTimeout(longPressRef.current.timer);
        longPressRef.current.timer = null;
      }
      if (longPressRef.current.active) {
        longPressRef.current.active = false;
        longPressRef.current.side = null;
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
  const onSideBlockerPointerDown = (side) => (e) => {
    if (!isMobile) return;
    // Record swipe start
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY) || 0;
    swipeStateRef.current = {
      pointerDown: true,
      startX: clientX,
      startY: clientY,
      dx: 0,
      swiping: false,
      side,
    };
    // Long-press timer (cancelled if swipe is detected)
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

  // Apply transform to swipe wrapper (no transition during drag)
  const setSwipeOffset = (dx, animated) => {
    const wrap = swipeWrapRef.current;
    if (!wrap) return;
    wrap.style.transition = animated ? `transform ${SWIPE_SNAP_MS}ms ease-out` : 'none';
    wrap.style.transform = `translate3d(${dx}px, 0, 0)`;
  };

  // Commit a swipe: animate the wrapper fully off-screen so the neighbor
  // placeholder slides into view. setActiveIdx fires immediately so YT seeks
  // in parallel with the slide animation; by the time the wrapper resets,
  // the new segment is loaded and visible.
  const commitSwipe = useCallback((dir) => {
    const cur = activeIdx;
    const next = cur + dir;
    if (next < 0 || next >= cutSegments.length) {
      // Edge - snap back (resistance already capped how far we dragged)
      setSwipeOffset(0, true);
      return;
    }
    const wrap = swipeWrapRef.current;
    if (!wrap) {
      setActiveIdx(next);
      return;
    }
    // Slide the wrapper fully off in the direction of the swipe.
    // dir = +1 -> next clip -> wrapper slides LEFT (negative dx).
    // dir = -1 -> prev clip -> wrapper slides RIGHT (positive dx).
    const containerW = wrap.parentElement?.clientWidth || window.innerWidth;
    const slideDistance = containerW + SWIPE_NEIGHBOR_GAP_PX;
    const targetDx = dir > 0 ? -slideDistance : slideDistance;
    wrap.style.transition = `transform ${SWIPE_COMMIT_MS}ms ease-out`;
    wrap.style.transform = `translate3d(${targetDx}px, 0, 0)`;
    // Commit segment change IMMEDIATELY so YT starts seeking in parallel
    // with the slide-off animation. By the time the wrapper resets, the
    // new segment is loaded and visible.
    setActiveIdx(next);
    // After the slide finishes, reset transform without animation.
    setTimeout(() => {
      const w = swipeWrapRef.current;
      if (w) {
        w.style.transition = 'none';
        w.style.transform = 'translate3d(0, 0, 0)';
      }
    }, SWIPE_COMMIT_MS);
  }, [activeIdx, cutSegments.length, setActiveIdx]);

  const onSideBlockerPointerMove = (e) => {
    if (!isMobile) return;
    const s = swipeStateRef.current;
    if (!s.pointerDown) return;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;
    const rawDx = clientX - s.startX;
    const rawDy = clientY - s.startY;
    // Promote to swipe only if horizontal movement dominates and exceeds threshold
    if (!s.swiping) {
      if (Math.abs(rawDx) > SWIPE_MOVE_THRESHOLD_PX && Math.abs(rawDx) > Math.abs(rawDy)) {
        s.swiping = true;
        // Cancel long-press timer so it doesn't fire mid-swipe
        if (longPressRef.current.timer) {
          clearTimeout(longPressRef.current.timer);
          longPressRef.current.timer = null;
        }
      } else {
        return;
      }
    }
    // Apply edge resistance + cap: at first clip dragging right resists,
    // at last clip dragging left resists. Past the cap, motion stops entirely.
    let dx = rawDx;
    const atStart = activeIdx <= 0;
    const atEnd = activeIdx >= cutSegments.length - 1;
    if (atStart && dx > 0) {
      dx = Math.min(dx * SWIPE_EDGE_RESIST, SWIPE_EDGE_CAP_PX);
    }
    if (atEnd && dx < 0) {
      dx = Math.max(dx * SWIPE_EDGE_RESIST, -SWIPE_EDGE_CAP_PX);
    }
    s.dx = dx;
    setSwipeOffset(dx, false);
  };

  const onSideBlockerPointerUp = () => {
    if (!isMobile) return;
    const s = swipeStateRef.current;
    const wasSwiping = s.swiping;
    const dx = s.dx;
    // Reset swipe state
    swipeStateRef.current = { pointerDown: false, startX: 0, startY: 0, dx: 0, swiping: false, side: null };

    // 1) Swipe path
    if (wasSwiping) {
      // Long-press timer was already cancelled when swipe started
      if (Math.abs(dx) > SWIPE_COMMIT_PX) {
        // dx > 0 -> finger moved right -> previous segment (dir = -1)
        // dx < 0 -> finger moved left -> next segment (dir = +1)
        commitSwipe(dx > 0 ? -1 : 1);
      } else {
        setSwipeOffset(0, true);
      }
      return;
    }
    // 2) Long-press path: end speed boost, don't toggle play
    if (endLongPress()) return;
    // 3) Tap path: pause/play
    togglePlay();
  };

  const onSideBlockerPointerCancel = () => {
    // Snap back if swiping was in progress
    const s = swipeStateRef.current;
    if (s.swiping) {
      setSwipeOffset(0, true);
    }
    swipeStateRef.current = { pointerDown: false, startX: 0, startY: 0, dx: 0, swiping: false, side: null };
    endLongPress();
  };

  // Seekbar
  const seekbarRef = useRef(null);
  const reelRef = useRef(null);
  // Compute new time from pointer event without seeking - for thumb updates
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

  // Throttled seek - visual thumb is always immediate, YT seekTo is rate-limited
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

  // Loop trigger is at end - LOOP_LEAD (see tick effect), so currentTime
  // never actually reaches end. Scale the bar against the *visible* duration
  // so progress hits 1.0 exactly when the loop fires.
  const segDuration = activeSegment ? activeSegment.end - activeSegment.start : 1;
  const visibleDuration = activeSegment
    ? Math.max(0.01, segDuration - LOOP_LEAD)
    : 1;
  const segProgress = activeSegment
    ? Math.max(0, Math.min(1, (currentTime - activeSegment.start) / visibleDuration))
    : 0;

  // Mobile fullscreen uses a custom bottom bar (seekbar + fullscreen button)
  // and a top-right counter pill. Everywhere else uses the standard ControlBar.
  const useFsMobileChrome = isMobile && isFullscreen;
  const showStandardBar = !useFsMobileChrome;

  const activeParsed = parsedSegments && activeIdx >= 0
    ? parsedSegments[activeIdx]
    : null;
  const counterDotClass =
    activeParsed?.quality === 'good'
      ? styles.dotGood
      : activeParsed?.quality === 'bad'
      ? styles.dotBad
      : styles.dotNeutral;

  const handleOpenInfo = () => {
    // Pause video when opening the info dialog. Do NOT auto-resume on close;
    // user un-pauses themselves when ready.
    const p = ytPlayerRef.current;
    if (p && p.pauseVideo) {
      try { p.pauseVideo(); } catch (e) {}
    }
    setShowInfo(true);
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.videoArea}>
        {isMobile ? (
          <div ref={swipeWrapRef} className={styles.swipeWrap}>
            <div className={styles.neighborSlot + ' ' + styles.neighborPrev} aria-hidden="true">
              <div className={styles.neighborInner}>
                {activeIdx > 0 && (
                  <div className={styles.neighborLabel}>← Prev Clip</div>
                )}
              </div>
            </div>
            <div className={styles.videoSlot}>
              <div ref={iframeContainerRef} className={styles.iframeContainerMobile}>
                <div ref={iframeScaleWrapRef} className={styles.iframeScaleWrap} />
              </div>
            </div>
            <div className={styles.neighborSlot + ' ' + styles.neighborNext} aria-hidden="true">
              <div className={styles.neighborInner}>
                {activeIdx < cutSegments.length - 1 && (
                  <div className={styles.neighborLabel}>Next clip →</div>
                )}
              </div>
            </div>
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
            {/* Bottom blocker - kills YT seekbar drag/tap */}
            <div className={styles.ytBottomBlocker} />
            {/* Left side - tap = pause/play, long-press = 0.5x speed, swipe = nav */}
            <div
              className={styles.ytLeftBlocker}
              onPointerDown={onSideBlockerPointerDown('left')}
              onPointerMove={onSideBlockerPointerMove}
              onPointerUp={onSideBlockerPointerUp}
              onPointerCancel={onSideBlockerPointerCancel}
              onPointerLeave={onSideBlockerPointerCancel}
            />
            {/* Right side - tap = pause/play, long-press = 2x speed, swipe = nav */}
            <div
              className={styles.ytRightBlocker}
              onPointerDown={onSideBlockerPointerDown('right')}
              onPointerMove={onSideBlockerPointerMove}
              onPointerUp={onSideBlockerPointerUp}
              onPointerCancel={onSideBlockerPointerCancel}
              onPointerLeave={onSideBlockerPointerCancel}
            />
            {/* Lower corners - fill bottom 50-130px on left/right 35%, leaving center 30% gap for YT passthrough */}
            <div
              className={styles.ytLowerLeftBlocker}
              onPointerDown={onSideBlockerPointerDown('left')}
              onPointerMove={onSideBlockerPointerMove}
              onPointerUp={onSideBlockerPointerUp}
              onPointerCancel={onSideBlockerPointerCancel}
              onPointerLeave={onSideBlockerPointerCancel}
            />
            <div
              className={styles.ytLowerRightBlocker}
              onPointerDown={onSideBlockerPointerDown('right')}
              onPointerMove={onSideBlockerPointerMove}
              onPointerUp={onSideBlockerPointerUp}
              onPointerCancel={onSideBlockerPointerCancel}
              onPointerLeave={onSideBlockerPointerCancel}
            />
            {/* Bottom-center 30% x 80px is uncovered -> YT passthrough for dim/undim */}
          </>
        ) : (
          <div
            className={styles.tapZone}
            onClick={handleTapZoneClick}
            onDoubleClick={handleTapZoneDoubleClick}
          />
        )}

        {useFsMobileChrome && cutSegments.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenInfo(); }}
            className={styles.fsTopCounter}
            aria-label="Clip info"
          >
            <span className={`${styles.fsTopCounterDot} ${counterDotClass}`} />
            <span>{Math.max(0, activeIdx) + 1}/{cutSegments.length}</span>
          </button>
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
          ⛶
        </button>
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

      <Modal
        opened={showInfo}
        onClose={() => setShowInfo(false)}
        title={activeSegment
          ? `CLIP ${Math.max(0, activeIdx) + 1} / ${cutSegments.length}`
          : 'CLIP INFO'}
        centered
        size="md"
        classNames={{ title: styles.infoModalTitle }}
      >
        {activeSegment && (() => {
          const parsed = activeParsed || parseLabel(activeSegment.name || '');
          const dur = activeSegment.end - activeSegment.start;
          const qLabel = parsed.quality === 'good'
            ? 'GOOD'
            : parsed.quality === 'bad'
            ? 'BAD'
            : 'NEUTRAL';
          const qClass = parsed.quality === 'good'
            ? styles.infoQualityGood
            : parsed.quality === 'bad'
            ? styles.infoQualityBad
            : styles.infoQualityNeutral;
          return (
            <div>
              <div className={styles.infoMetaRow}>
                <span className={`${styles.infoQualityBadge} ${qClass}`}>{qLabel}</span>
                <span className={styles.infoTimeRange}>
                  {formatTime(activeSegment.start)} → {formatTime(activeSegment.end)}
                  <span className={styles.infoDuration}> · {formatTime(dur)}</span>
                </span>
              </div>

              {parsed.actions && parsed.actions.length > 0 && (
                <div className={styles.infoSection}>
                  <div className={styles.infoSectionTitle}>ACTIONS</div>
                  <ul className={styles.infoActionList}>
                    {parsed.actions.map((a, i) => {
                      const dotCls = a.quality === 'good'
                        ? styles.dotGood
                        : a.quality === 'bad'
                        ? styles.dotBad
                        : styles.dotNeutral;
                      return (
                        <li key={i} className={styles.infoActionRow}>
                          <span className={`${styles.infoActionDot} ${dotCls}`} />
                          <div className={styles.infoActionBody}>
                            <div className={styles.infoActionHead}>
                              <span className={styles.infoActionType}>{a.type}</span>
                              <span className={styles.infoActionTeam}>
                                {a.team === 'opponent' ? 'OPP' : 'US'}
                              </span>
                              {a.players && a.players.length > 0 && (
                                <span className={styles.infoActionPlayers}>
                                  {a.players.join(', ')}
                                </span>
                              )}
                            </div>
                            {a.note && <div className={styles.infoActionNote}>{a.note}</div>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>RAW LABEL</div>
                <div className={styles.infoRaw}>{activeSegment.name || '(empty)'}</div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
