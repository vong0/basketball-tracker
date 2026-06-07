import { useState, useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '../../lib/youtube';
import { formatTime } from '../../lib/time';
import TitleBar from './TitleBar';
import ControlBar from './ControlBar';
import SpeedIndicator from './SpeedIndicator';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer({
  videoId,
  segments,
  parsedSegments,
  activeIdx,
  setActiveIdx,
  isFullscreen,
  setIsFullscreen,
  isMobile,
  showHelp,
  setShowHelp,
  autoplayNext
}) {
  const ytPlayerRef = useRef(null);
  const containerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [speedIndicator, setSpeedIndicator] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fadeTimerRef = useRef(null);
  const tickRef = useRef(null);
  const speedKeyRef = useRef({ shift: false, ctrl: false });
  const longPressRef = useRef({ timer: null, active: false, side: null });
  const lastTapRef = useRef({ time: 0, side: null });

  const playbackQuality = 'hd1080;'
  const activeSegment = activeIdx >= 0 ? segments[activeIdx] : null;
  const activeParsed = activeIdx >= 0 ? parsedSegments[activeIdx] : null;

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
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          playsinline: 1,
          vq: {playbackQuality},
        },
        events: {
          onReady: (e) => {
            setPlayerReady(true);
            // Request highest available quality
            try {
              e.target.setPlaybackQuality({playbackQuality});
            } catch (err) {}
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              setIsPlaying(true);
              // Re-assert quality when playback starts (YouTube sometimes resets it)
              try {
                ytPlayerRef.current?.setPlaybackQuality({playbackQuality});
              } catch (err) {}
            }
            else if (e.data === 2 || e.data === 0) setIsPlaying(false);
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

  // Tick: poll currentTime + auto-pause at segment end (once)
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
        try {
          p.pauseVideo();
          p.seekTo(activeSegment.end, true);
        } catch (e) {}
      }
      // Reset the flag if user seeks back into the segment
      if (activeSegment && pausedAtEnd && t < activeSegment.end - 0.1) {
        pausedAtEnd = false;
      }
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [playerReady, activeIdx, activeSegment]);

  // Seek to active segment when it changes (e.g. from playlist click)
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
    const seg = segments[idx];
    const p = ytPlayerRef.current;
    if (p && p.seekTo && p.playVideo) {
      try {
        p.seekTo(seg.start, true);
        p.playVideo();
      } catch (e) {}
    }
  }, [segments, setActiveIdx]);

  const togglePlay = useCallback(() => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (activeIdx < 0) {
      playSegment(0);
      return;
    }
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
    if (activeSegment) {
      nt = Math.max(activeSegment.start, Math.min(activeSegment.end, nt));
    }
    try { p.seekTo(nt, true); } catch (e) {}
  }, [activeSegment]);

  const frameStep = useCallback((dir) => {
    seekDelta(dir * (1 / 30));
  }, [seekDelta]);

  const setRate = useCallback((rate) => {
    const p = ytPlayerRef.current;
    if (!p || !p.setPlaybackRate) return;
    try { p.setPlaybackRate(rate); } catch (e) {}
    setSpeedIndicator(rate === 1 ? null : rate);
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

  const resetFadeTimer = useCallback(() => {
    setTitleVisible(true);
    setControlsVisible(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setTitleVisible(false);
      if (isFullscreen || isMobile) setControlsVisible(false);
    }, 3000);
  }, [isFullscreen, isMobile]);

  useEffect(() => {
    resetFadeTimer();
    return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
  }, [resetFadeTimer, activeIdx]);

  // Keyboard shortcuts (desktop)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        setShowHelp(s => !s);
        return;
      }

      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); return; }
        if (document.fullscreenElement) document.exitFullscreen?.();
        return;
      }

      if (showHelp) return;

      if (e.key === 'Shift' && !speedKeyRef.current.shift) {
        speedKeyRef.current.shift = true;
        setRate(2);
        return;
      }
      if (e.key === 'Control' && !speedKeyRef.current.ctrl) {
        speedKeyRef.current.ctrl = true;
        setRate(0.5);
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekDelta(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekDelta(1);
          break;
        case ',':
          e.preventDefault();
          frameStep(-1);
          break;
        case '.':
          e.preventDefault();
          frameStep(1);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          navSegment(-1);
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          navSegment(1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
      resetFadeTimer();
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift' && speedKeyRef.current.shift) {
        speedKeyRef.current.shift = false;
        setRate(1);
      }
      if (e.key === 'Control' && speedKeyRef.current.ctrl) {
        speedKeyRef.current.ctrl = false;
        setRate(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile, togglePlay, seekDelta, frameStep, navSegment, toggleFullscreen, setRate, resetFadeTimer, showHelp, setShowHelp]);

  // Mouse move resets fade timer (desktop)
  useEffect(() => {
    if (isMobile) return;
    const onMove = () => resetFadeTimer();
    const c = containerRef.current;
    if (c) c.addEventListener('mousemove', onMove);
    return () => { if (c) c.removeEventListener('mousemove', onMove); };
  }, [isMobile, resetFadeTimer]);

  // Mobile gestures
  const onVideoPointerDown = (e) => {
    if (!isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';

    longPressRef.current.timer = setTimeout(() => {
      longPressRef.current.active = true;
      longPressRef.current.side = side;
      setRate(side === 'left' ? 0.5 : 2);
    }, 500);
  };

  const onVideoPointerUp = (e) => {
    if (!isMobile) return;
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
      setTimeout(() => {
        if (lastTapRef.current.time === now) {
          setControlsVisible(v => !v);
          setTitleVisible(v => !v);
        }
      }, 300);
    }
  };

  // Seekbar
  const seekbarRef = useRef(null);
  const handleSeekbarPointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleSeekbarMove(e);
    const onMove = (ev) => handleSeekbarMove(ev);
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleSeekbarMove = (e) => {
    if (!seekbarRef.current || !activeSegment) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const x = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX)) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const duration = activeSegment.end - activeSegment.start;
    const newTime = activeSegment.start + pct * duration;
    const p = ytPlayerRef.current;
    if (p && p.seekTo) try { p.seekTo(newTime, true); } catch (e) {}
    setCurrentTime(newTime);
  };

  const segDuration = activeSegment ? activeSegment.end - activeSegment.start : 1;
  const segProgress = activeSegment
    ? Math.max(0, Math.min(1, (currentTime - activeSegment.start) / segDuration))
    : 0;

  const counterText = activeIdx >= 0 ? '[' + (activeIdx + 1) + '/' + segments.length + ']' : '';
  const qualityDot = activeParsed
    ? (activeParsed.quality === 'good' ? '🟢' : activeParsed.quality === 'bad' ? '🔴' : '⚪')
    : '';

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}
    >
      <div ref={iframeContainerRef} className={styles.iframeContainer} />

      {/* Cover YouTube branding/title bar that appears on hover/pause */}
      <div className={styles.ytTopCover} />

      {/* Hide end-screen related videos grid */}
      <div className={`${styles.ytEndCover} ${!isPlaying && activeSegment && currentTime >= activeSegment.end - 0.5 ? styles.active : ''}`} />

      <div
        className={styles.tapZone}
        onPointerDown={onVideoPointerDown}
        onPointerUp={onVideoPointerUp}
        onClick={!isMobile ? togglePlay : undefined}
        onDoubleClick={!isMobile ? toggleFullscreen : undefined}
      />

      <SpeedIndicator rate={speedIndicator} />

      {!isMobile && !isFullscreen && activeIdx >= 0 && (
        <TitleBar
          counterText={counterText}
          qualityDot={qualityDot}
          title={activeParsed.title}
          visible={titleVisible}
          onHelp={() => setShowHelp(true)}
        />
      )}

      {isFullscreen && !isMobile && (
        <div className={`${styles.fsTopRight} ${titleVisible ? '' : styles.faded}`}>
          <span className={styles.fsCounter}>
            {counterText} {qualityDot}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowHelp(true); }}
            className={styles.fsButton}
          >
            ?
          </button>
        </div>
      )}

      {isMobile && isFullscreen && controlsVisible && activeIdx >= 0 && (
        <div className={styles.mobileTopOverlay}>
          <span className={styles.mobileCounter}>{counterText}</span>
          <span className={styles.mobileDot}>{qualityDot}</span>
          <span className={styles.mobileTitle}>{activeParsed.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowHelp(true); }}
            className={styles.mobileButton}
          >
            ?
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className={styles.mobileButton}
          >
            ✕
          </button>
        </div>
      )}

      {isMobile && isFullscreen && activeSegment && (
        <div className={styles.thinSeekbar}>
          <div
            className={styles.thinSeekbarFill}
            style={{ width: (segProgress * 100) + '%' }}
          />
        </div>
      )}

      {(!isMobile || (isMobile && controlsVisible)) && activeSegment && (
        <ControlBar
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          currentTime={currentTime}
          activeSegment={activeSegment}
          segDuration={segDuration}
          segProgress={segProgress}
          isDragging={isDragging}
          seekbarRef={seekbarRef}
          onSeekbarPointerDown={handleSeekbarPointerDown}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          visible={controlsVisible}
        />
      )}

      {isMobile && !isFullscreen && controlsVisible && activeSegment && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowHelp(true); }}
          className={styles.mobileHelpBtn}
        >
          ?
        </button>
      )}
    </div>
  );
}
