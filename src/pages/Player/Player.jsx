import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader, Center } from '@mantine/core';
import Banner from '../../components/Banner/Banner';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayer';
import Playlist from '../../components/Playlist/Playlist';
import ShortcutsModal from '../../components/ShortcutsModal/ShortcutsModal';
import { parseLabel, segmentMatchesFilter } from '../../lib/parseLabel';
import { navigate } from '../../lib/routing';
import { deriveFilterOptions, buildFilter, EMPTY_CHOICE } from '../../lib/deriveFilterOptions';
import { getGame, getGameClips } from '../../lib/backend.js';
import styles from './Player.module.css';

export default function Player({ gameId, isMobile }) {
  const [game, setGame] = useState(null);
  const [cutSegments, setCutSegments] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [videoCollapsed, setVideoCollapsed] = useState(false);
  const [filterChoice, setFilterChoice] = useState(EMPTY_CHOICE);
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
    let cancelled = false;
    setGame(null);
    setCutSegments(null);
    setLoadError(null);

    (async () => {
      try {
        const [gameData, clipsData] = await Promise.all([
          getGame(gameId),
          getGameClips(gameId),
        ]);
        if (cancelled) return;
        setGame(gameData);
        setCutSegments(clipsData.clips);
      } catch (err) {
        if (cancelled) return;
        console.error('Could not load game:', err);
        setLoadError(String(err.message || err));
      }
    })();

    return () => { cancelled = true; };
  }, [gameId]);

  const segments = cutSegments ?? [];
  const parsedSegments = useMemo(
    () => segments.map(s => parseLabel(s.name || '')),
    [segments]
  );
  const filterOptions = useMemo(
    () => deriveFilterOptions(parsedSegments),
    [parsedSegments]
  );

  const filter = useMemo(() => buildFilter(filterChoice), [filterChoice]);

  const visibleIndices = useMemo(() => {
    if (!filter) return segments.map((_, i) => i);
    const out = [];
    for (let i = 0; i < segments.length; i++) {
      if (segmentMatchesFilter(parsedSegments[i], filter)) out.push(i);
    }
    return out;
  }, [segments, parsedSegments, filter]);

  const prevFilterRef = useRef(filter);
  useEffect(() => {
    if (prevFilterRef.current === filter) return;
    prevFilterRef.current = filter;
    setActiveIdx(visibleIndices.length > 0 ? visibleIndices[0] : -1);
  }, [filter, visibleIndices]);

  if (loadError) {
    return (
      <div className={styles.app}>
        <Banner />
        <div className={styles.errorBox}>
          <div>Could not load this game.</div>
          <div className={styles.errorDetail}>{loadError}</div>
          <button className={styles.errorBack} onClick={() => navigate('#/')}>
            ← Back to games
          </button>
        </div>
      </div>
    );
  }

  if (!cutSegments || !game) {
    return (
      <Center h="100vh">
        <Loader color="orange" />
      </Center>
    );
  }

  return (
    <div className={styles.app}>
      {!isFullscreen && <Banner game={game} />}
      <div className={`${styles.main} ${videoCollapsed ? styles.videoCollapsed : ''}`}>
        <div className={styles.videoWrap}>
          <VideoPlayer
            ref={videoPlayerRef}
            key={isMobile ? 'mobile' : 'desktop'}
            videoId={game.videoId}
            cutSegments={segments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            visibleIndices={visibleIndices}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
          />
        </div>
        {!isFullscreen && (
          <Playlist
            title={game.game}
            cutSegments={segments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            visibleIndices={visibleIndices}
            filterChoice={filterChoice}
            setFilterChoice={setFilterChoice}
            filterOptions={filterOptions}
            isMobile={isMobile}
            onHelp={openHelp}
            onFilterOpen={() => videoPlayerRef.current?.pauseAndRemember?.()}
            onFilterClose={() => videoPlayerRef.current?.resumeIfWasPlaying?.()}
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
