import { useState, useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '../../lib/youtube';
import ControlBar from './ControlBar';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer({
  videoId,
  segments,
  activeIdx,
  setActiveIdx,
  isFullscreen,
  setIsFullscreen,
  isMobile,
  loopSegment
}) {
  const ytPlayerRef = useRef(null);
  const containerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const tickRef = useRef(null);
  const speedKeyRef = useRef({ shift: false, ctrl: false });
  const longPressRef = useRef({ timer: null, active: false, side: null });
  const lastTapRef = useRef({ time: 0, side: null });
  const loopRef = useRef(loopSegment);

  useEffect(() => { loopRef.current = loopSegment; }, [loopSegment]);

  const activeSegment = activeIdx >= 0 ? segments[activeIdx] : null;

  // YouTube setup
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      const div = document.createElement('div');
      div.id = 'yt-player-' + Math.random().toString(36).slice(2);
      if (iframeContainerRef.current) {
        iframeContainerRef.current.innerHTML = '';
        iframeContainerRef.current.appendChild(div);
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
            try { e.target.setPlaybackQuality('hd1080'); } catch (err) {}
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              setIsPlaying(true);
              try { ytPlayerRef.current?.setPlaybackQuality('hd1080'); } catch (err) {}
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

  // Tick: poll currentTime + loop or pause at segment end
  useEffect(() => {
    if (!playerReady) return;
    let pausedAtEnd = false;
    tickRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime();
      setCurrentTime(t);
      if (activeSegment && !pausedAtEnd && t >= activeSegment.end - 0.05) {
        pausedAtEnd = true;
        if (loopRef.current) {
          try { p.seekTo(activeSegment.start, true); } catch (e) {}
          pausedAtEnd = false;
        } else {
          try {
            p.pauseVideo();
            p.seekTo(activeSegment.end, true);
          } catch (e) {}
        }
      }
      if (activeSegment && pausedAtEnd && t < activeSegment.end - 0.1) {
        pausedAtEnd = false;
      }
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [playerReady, activeIdx, activeSegment]);

  // Seek to active segment when it changes
  useEffect(() => {
    if (!playerReady || activeIdx < 0) return;
    const seg = segments[activeIdx];
    if (!seg) return;
    const p = ytPlayerRef.current;
    if (!p || !p.seekTo) return;
    try {
      p.seekTo(seg.start, true);
      p.playVideo();
    } catch (e) {}
  }, [activeIdx, playerReady, segments]);

  const playSegment = useCallback((idx) => {
    if (idx < 0 || idx >= segments.length) return;
    setActiveIdx(idx);
  }, [segments, setActiveIdx]);

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

  const frameStep = useCallback((dir) => { seekDelta(dir * (1 / 30)); }, [seekDelta]);

  const setRate = useCallback((rate) => {
    const p = ytPlayerRef.current;
    if (!p || !p.setPlaybackRate) return;
    try { p.setPlaybackRate(rate); } catch (e) {}
  }, []);

  const navSegment = useCallback((dir) => {
    const cur = activeIdx;
    const next = cur < 0 ? 0 : Math.max(0, Math.min(segments.length - 1, cur + dir));
    if (next !== cur || cur < 0) playSegment(next);
  }, [activeIdx, segments.length, playSegment]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [setIsFullscreen]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setIsFullscreen]);

  // Reset speed on blur / tab hidden (prevents stuck 2x or 0.5x)
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
        case ',': e.preventDefault(); frameStep(-1); break;
        case '.': e.preventDefault(); frameStep(1); break;
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
  }, [isMobile, togglePlay, seekDelta, frameStep, navSegment, toggleFullscreen, setRate]);

  // Mobile fullscreen gestures
  const onTapZonePointerDown = (e) => {
    if (!(isMobile && isFullscreen)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    longPressRef.current.timer = setTimeout(() => {
      longPressRef.current.active = true;
      longPressRef.current.side = side;
      setRate(side === 'left' ? 0.5 : 2);
    }, 500);
  };
  const onTapZonePointerUp = (e) => {
    if (!(isMobile && isFullscreen)) return;
    if (longPressRef.current.timer) clearTimeout(longPressRef.current.timer);
    if (longPressRef.current.active) {
      longPressRef.current.active = false;
      longPressRef.current.side = null;
      setRate(1);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || (e.changedTouches && e.changedTouches[0].clientX)) - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
      seekDelta(side === 'left' ? -1 : 1);
      lastTapRef.current.time = 0;
    } else {
      lastTapRef.current = { time: now, side };
      togglePlay();
    }
  };

  // Seekbar
  const seekbarRef = useRef(null);
  const reelRef = useRef(null);
  const handleSeekbarMove = useCallback((e, ref) => {
    const node = ref?.current || seekbarRef.current;
    if (!node || !activeSegment) return;
    const rect = node.getBoundingClientRect();
    const x = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX)) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const duration = activeSegment.end - activeSegment.start;
    const newTime = activeSegment.start + pct * duration;
    const p = ytPlayerRef.current;
    if (p && p.seekTo) try { p.seekTo(newTime, true); } catch (err) {}
    setCurrentTime(newTime);
  }, [activeSegment]);

  const handleSeekbarPointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleSeekbarMove(e, seekbarRef);
    const onMove = (ev) => handleSeekbarMove(ev, seekbarRef);
    const onUp = () => {
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
    handleSeekbarMove(e, reelRef);
    const onMove = (ev) => handleSeekbarMove(ev, reelRef);
    const onUp = () => {
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
        <div ref={iframeContainerRef} className={styles.iframeContainer} />
        {isMobile && isFullscreen && (
          <div
            className={styles.tapZone}
            onPointerDown={onTapZonePointerDown}
            onPointerUp={onTapZonePointerUp}
          />
        )}
        {isMobile && isFullscreen && (
          <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className={styles.fsExpandBtn}>
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
