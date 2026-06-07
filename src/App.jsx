import { useState, useEffect, useMemo } from 'react';
import { Loader, Center } from '@mantine/core';
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
  const [loopSegment, setLoopSegment] = useState(true);
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    fetch('./data/games/y26-divA-game1.json')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setGameData)
      .catch(err => {
        console.warn('Using demo data:', err);
        setGameData({
          schemaVersion: 1,
          game: {
            id: 'demo-game',
            date: '2026-06-06',
            opponent: 'Demo',
            youtubeUrl: 'https://www.youtube.com/watch?v=yqoCezBgPdk',
            result: 'DEMO'
          },
          segments: [
            { id: 's1', start: 30, end: 45, label: 'UG(O) matt: drives and kicks for open three' },
            { id: 's2', start: 60, end: 75, label: 'OB(D) vong: lost rotation on weak side' },
            { id: 's3', start: 120, end: 140, label: 'UG(MAN) george: solid help defense and a much longer label to test wrapping behavior on two lines' },
            { id: 's4', start: 200, end: 215, label: 'O(2-3) opponent runs 2-3 zone' },
            { id: 's5', start: 250, end: 268, label: 'UG(O) matt,vong: pick and roll for layup' },
            { id: 's6', start: 300, end: 315, label: 'UB(O) george: travel turnover' },
            { id: 's7', start: 360, end: 380, label: 'U(3-2) we switch to 3-2 zone' },
            { id: 's8', start: 420, end: 438, label: 'UG(D) matt: blocked shot at the rim' }
          ]
        });
      });
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const segments = gameData?.segments || [];
  const parsedSegments = useMemo(
    () => segments.map(s => parseLabel(s.label || '')),
    [segments]
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
      {!isFullscreen && <Banner />}

      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop}`}>
        <div className={styles.videoWrap}>
          <VideoPlayer
            videoId={videoId}
            segments={segments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
            loopSegment={loopSegment}
          />
        </div>

        {!isFullscreen && (
          <Playlist
            segments={segments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            loopSegment={loopSegment}
            setLoopSegment={setLoopSegment}
            isMobile={isMobile}
            onHelp={() => setShowHelp(true)}
          />
        )}
      </div>

      <ShortcutsModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        isMobile={isMobile}
      />
    </div>
  );
}
