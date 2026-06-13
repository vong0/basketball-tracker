import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader, Center } from '@mantine/core';
import JSON5 from 'json5';
import Banner from '../Banner/Banner';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import Playlist from '../Playlist/Playlist';
import ShortcutsModal from '../ShortcutsModal/ShortcutsModal';
import { parseLabel, segmentMatchesFilter } from '../../lib/parseLabel';
import { getYouTubeId } from '../../lib/youtube';
import { navigate } from '../../lib/routing';
import { deriveFilterOptions, buildFilter, EMPTY_CHOICE } from '../../lib/deriveFilterOptions';
import styles from './Player.module.css';

export default function Player({ gameId, isMobile }) {
  const [gameMeta, setGameMeta] = useState(null);
  const [gameData, setGameData] = useState(null);
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

  // Load games.json -> find entry -> load LLC -> extract cutSegments.
  useEffect(() => {
    let cancelled = false;
    setGameMeta(null);
    setGameData(null);
    setLoadError(null);

    fetch('./data/games.json')
      .then(r => r.ok ? r.json() : Promise.reject('games.json ' + r.status))
      .then(games => {
        if (cancelled) return null;
        const entry = games[gameId];
        if (!entry) {
          throw new Error('Unknown game id: ' + gameId);
        }
        setGameMeta(entry);
        return fetch('./data/' + entry.llc);
      })
      .then(r => {
        if (cancelled || !r) return null;
        if (!r.ok) return Promise.reject('LLC ' + r.status);
        return r.text();
      })
      .then(text => {
        if (cancelled || !text) return;
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = JSON5.parse(text);
        }
        if (data && Array.isArray(data.cutSegments)) {
          data.cutSegments = data.cutSegments
            .filter(s => typeof s.start === 'number' && typeof s.end === 'number')
            .map(s => ({
              ...s,
              start: Math.floor(s.start),
              end: Math.ceil(s.end),
            }));
        }
        setGameData(data);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Could not load game:', err);
        setLoadError(String(err.message || err));
      });

    return () => { cancelled = true; };
  }, [gameId]);

  const cutSegments = gameData?.cutSegments || [];
  const parsedSegments = useMemo(
    () => cutSegments.map(s => parseLabel(s.name || '')),
    [cutSegments]
  );
  const filterOptions = useMemo(
    () => deriveFilterOptions(parsedSegments),
    [parsedSegments]
  );

  const filter = useMemo(() => buildFilter(filterChoice), [filterChoice]);

  // visibleIndices: indices into the ORIGINAL cutSegments array that
  // pass the active filter. activeIdx still indexes the original array;
  // navigation helpers walk this list.
  const visibleIndices = useMemo(() => {
    if (!filter) return cutSegments.map((_, i) => i);
    const out = [];
    for (let i = 0; i < cutSegments.length; i++) {
      if (segmentMatchesFilter(parsedSegments[i], filter)) out.push(i);
    }
    return out;
  }, [cutSegments, parsedSegments, filter]);

  // When the filter changes, jump to the first visible clip (or -1 if
  // none). Skip on initial mount when nothing is filtered yet.
  const prevFilterRef = useRef(filter);
  useEffect(() => {
    if (prevFilterRef.current === filter) return;
    prevFilterRef.current = filter;
    setActiveIdx(visibleIndices.length > 0 ? visibleIndices[0] : -1);
  }, [filter, visibleIndices]);

  const videoId = useMemo(
    () => gameMeta ? getYouTubeId(gameMeta.youtubeUrl) : null,
    [gameMeta]
  );

  if (loadError) {
    return (
      <div className={styles.app}>
        <Banner isMobile={isMobile} />
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

  if (!gameData || !gameMeta) {
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
            visibleIndices={visibleIndices}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
          />
        </div>
        {!isFullscreen && (
          <Playlist
            title={gameMeta.name}
            cutSegments={cutSegments}
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
