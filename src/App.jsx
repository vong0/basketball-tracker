import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader, Center } from '@mantine/core';
import JSON5 from 'json5';
import Banner from './components/Banner/Banner';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import Playlist from './components/Playlist/Playlist';
import ShortcutsModal from './components/ShortcutsModal/ShortcutsModal';
import { parseLabel } from './lib/parseLabel';
import { getYouTubeId } from './lib/youtube';
import { isMobileDevice } from './lib/isMobile';
import styles from './App.module.css';

export default function App() {
  const [gameData, setGameData] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [videoCollapsed, setVideoCollapsed] = useState(false);
  const videoPlayerRef = useRef(null);

  const toggleVideoCollapsed = useCallback(
    () => setVideoCollapsed(v => !v),
    []
  );

  const openHelp = useCallback(() => {
    videoPlayerRef.current?.pauseAndRemember?.();
    setShowHelp(true);
  }, []);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
    videoPlayerRef.current?.resumeIfWasPlaying?.();
  }, []);

  // Global `/` toggles the shortcuts modal. `i` is handled inside VideoPlayer.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        if (showHelp) closeHelp();
        else openHelp();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHelp, openHelp, closeHelp]);

  useEffect(() => {
    // fetch('./data/games/nba-game.json')
    // fetch('./data/games/y26-divA-game1.json')
    fetch('./data/games/y26-edit.json')
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(text => {
        try {
          return JSON.parse(text);
        } catch {
          return JSON5.parse(text);
        }
      })
      .then(data => {
        // Drop marker-only entries (no end) and round times so YouTube's
        // seekTo lands a hair before/after the keyframe instead of truncating.
        if (data && Array.isArray(data.cutSegments)) {
          data.cutSegments = data.cutSegments
            .filter(s => typeof s.start === 'number' && typeof s.end === 'number')
            .map(s => ({
              ...s,
              start: Math.floor(s.start),
              end: Math.ceil(s.end),
            }));
        }
        return data;
      })
      .then(setGameData)
      .catch(err => {
        console.error('Could not load anything:', err);
      });
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cutSegments = gameData?.cutSegments || [];
  const parsedSegments = useMemo(
    () => cutSegments.map(s => parseLabel(s.name || '')),
    [cutSegments]
  );
  const videoId = useMemo(
    () => gameData ? getYouTubeId(gameData.game?.youtubeUrl) : null,
    [gameData]
  );

  if (!gameData) {
    return (
      <Center h="100vh">
        <Loader color="orange" />
      </Center>
    );
  }

  return (
    <div className={styles.app}>
      {!isFullscreen && <Banner isMobile={isMobile} />}

      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop} ${isMobile && videoCollapsed ? styles.videoCollapsed : ''}`}>
        <div className={styles.videoWrap}>
          <VideoPlayer
            ref={videoPlayerRef}
            key={isMobile ? 'mobile' : 'desktop'}
            videoId={videoId}
            cutSegments={cutSegments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
          />
        </div>

        {!isFullscreen && (
          <Playlist
            cutSegments={cutSegments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            isMobile={isMobile}
            onHelp={openHelp}
            videoCollapsed={videoCollapsed}
            onToggleVideoCollapsed={toggleVideoCollapsed}
          />
        )}
      </div>

      <ShortcutsModal
        open={showHelp}
        onClose={closeHelp}
        isMobile={isMobile}
      />
    </div>
  );
}
