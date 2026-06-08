import { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    fetch('./data/games/y26-divA-game1.json')
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(text => {
        try {
          return JSON.parse(text);
        } catch {
          return JSON5.parse(text);
        }
      })
      .then(setGameData)
      .catch(err => {
        console.warn('Using demo data:', err);
        setGameData({
          game: {
            youtubeUrl: 'https://www.youtube.com/watch?v=yqoCezBgPdk'
          },
          cutSegments: [
            { start: 30, end: 45, name: 'UG(O) matt: drives and kicks for open three' },
            { start: 60, end: 75, name: 'OB(D) vong: lost rotation on weak side' },
            { start: 120, end: 140, name: 'UG(MAN) george: solid help defense and a much longer label to test wrapping behavior on two lines' },
            { start: 200, end: 215, name: 'O(2-3) opponent runs 2-3 zone' },
            { start: 250, end: 268, name: 'UG(O) matt,vong: pick and roll for layup' },
            { start: 300, end: 315, name: 'UB(O) george: travel turnover' },
            { start: 360, end: 380, name: 'U(3-2) we switch to 3-2 zone' },
            { start: 420, end: 438, name: 'UG(D) matt: blocked shot at the rim' }
          ]
        });
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

      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop}`}>
        <div className={styles.videoWrap}>
          <VideoPlayer
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
