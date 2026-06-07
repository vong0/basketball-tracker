"""
Creates all componentized files for the basketball film player.
Run from your project root (the folder containing src/).
Overwrites existing files.
"""

from pathlib import Path

# ============================================================
# Define all files as (relative_path, content) tuples
# ============================================================

FILES = {}

# ---------------- src/main.jsx ----------------
FILES["src/main.jsx"] = """import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './theme.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>
);
"""

# ---------------- src/theme.css ----------------
FILES["src/theme.css"] = """@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg: #0a0a0a;
  --bg-elevated: #0d0d0d;
  --border: #1a1a1a;
  --border-strong: #2a2a2a;
  --text: #f5f5f5;
  --text-dim: rgba(255, 255, 255, 0.6);
  --text-faint: rgba(255, 255, 255, 0.4);
  --orange: #ff5c1a;
  --green: #4ade80;
  --red: #f87171;
  --gray-dot: #9ca3af;

  --font-display: 'Bebas Neue', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Inter', sans-serif;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
"""

# ---------------- src/App.jsx ----------------
FILES["src/App.jsx"] = """import { useState, useEffect, useMemo } from 'react';
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
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(false);
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
            { id: 's3', start: 120, end: 140, label: 'UG(MAN) george: solid help defense' },
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
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            isMobile={isMobile}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
            autoplayNext={autoplayNext}
          />
        </div>

        {!isFullscreen && (
          <Playlist
            segments={segments}
            parsedSegments={parsedSegments}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            autoplayNext={autoplayNext}
            setAutoplayNext={setAutoplayNext}
            isMobile={isMobile}
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
"""

# ---------------- src/App.module.css ----------------
FILES["src/App.module.css"] = """.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.mainDesktop {
  flex-direction: row;
}

.mainMobile {
  flex-direction: column;
}

.videoWrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #000;
  min-width: 0;
}
"""

# ---------------- src/lib/parseLabel.js ----------------
FILES["src/lib/parseLabel.js"] = """/**

 * Parse a segment label like "UG(O) matt: drives and kicks | vong: cuts to rim"
 * into structured action data.
 *
 * Format: TEAM[QUALITY](TYPE) player1,player2: note | more...
 *   TEAM:    U (us) | O (opponent)
 *   QUALITY: G (good) | B (bad) | omit (neutral)
 *   TYPE:    O | D | MAN | 2-3 | 3-2
 */
export function parseLabel(label) {
  if (!label || typeof label !== 'string') {
    return { actions: [], title: label || '', quality: 'neutral', team: 'us', type: 'O' };
  }

  const segments = label.split('|').map(s => s.trim()).filter(Boolean);
  let lastCode = null;
  const actions = [];

  for (const seg of segments) {
    const m = seg.match(/^(?:([UO])([GB]?)\\(([A-Z0-9-]+)\\)\\s*)?(.*)$/);
    if (!m) continue;

    const [, teamCode, qualCode, typeCode, rest] = m;
    let code = (teamCode && typeCode) ? { team: teamCode, qual: qualCode, type: typeCode } : lastCode;
    if (teamCode && typeCode) lastCode = code;
    if (!code) code = { team: 'U', qual: '', type: 'O' };

    let players = [];
    let note = rest.trim();
    const colonIdx = rest.indexOf(':');
    if (colonIdx >= 0) {
      const playersStr = rest.slice(0, colonIdx).trim();
      note = rest.slice(colonIdx + 1).trim();
      if (playersStr) {
        players = playersStr.split(',').map(p => p.trim()).filter(Boolean);
      }
    }

    actions.push({
      team: code.team === 'O' ? 'opponent' : 'us',
      quality: code.qual === 'G' ? 'good' : code.qual === 'B' ? 'bad' : 'neutral',
      type: code.type,
      players,
      note
    });
  }

  const first = actions[0] || { players: [], note: '', quality: 'neutral', team: 'us', type: 'O' };
  let title;
  if (first.players.length > 0 && first.note) {
    title = first.players.join(', ') + ': ' + first.note;
  } else if (first.players.length > 0) {
    title = first.players.join(', ');
  } else if (first.note) {
    title = first.note;
  } else {
    title = label;
  }

  return {
    actions,
    title,
    quality: first.quality,
    team: first.team,
    type: first.type
  };
}
"""

# ---------------- src/lib/youtube.js ----------------
FILES["src/lib/youtube.js"] = """let ytApiPromise = null;

export function loadYouTubeAPI() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
  return ytApiPromise;
}

export function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\\.be\\/|embed\\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
"""

# ---------------- src/lib/time.js ----------------
FILES["src/lib/time.js"] = """export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}
"""

# ---------------- src/lib/isMobile.js ----------------
FILES["src/lib/isMobile.js"] = """export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(max-width: 900px)').matches ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')
  );
}
"""

# ---------------- src/components/Banner/Banner.jsx ----------------
FILES["src/components/Banner/Banner.jsx"] = """import styles from './Banner.module.css';

export default function Banner() {
  return (
    <div className={styles.banner}>
      <div className={styles.brand}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ff5c1a" />
          <path
            d="M2 12 H22 M12 2 V22 M5 5 Q12 12 19 5 M5 19 Q12 12 19 19"
            stroke="#0a0a0a"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <span className={styles.wordmark}>SPARTANS</span>
      </div>
      <nav className={styles.nav}>
        <button className={`${styles.tab} ${styles.active}`}>Games</button>
      </nav>
    </div>
  );
}
"""

# ---------------- src/components/Banner/Banner.module.css ----------------
FILES["src/components/Banner/Banner.module.css"] = """.banner {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 0 24px;
  height: 56px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 40;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wordmark {
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 0.04em;
}

.nav {
  display: flex;
  align-items: center;
  height: 100%;
}

.tab {
  position: relative;
  background: none;
  border: none;
  padding: 0 16px;
  height: 100%;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
  font-family: inherit;
}

.tab:hover {
  color: #fff;
}

.tab.active {
  color: #fff;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--orange);
}
"""

# ---------------- src/components/Playlist/Playlist.jsx ----------------
FILES["src/components/Playlist/Playlist.jsx"] = """import { Checkbox } from '@mantine/core';
import PlaylistRow from './PlaylistRow';
import styles from './Playlist.module.css';

export default function Playlist({
  segments,
  parsedSegments,
  activeIdx,
  setActiveIdx,
  autoplayNext,
  setAutoplayNext,
  isMobile
}) {
  return (
    <aside className={`${styles.playlist} ${isMobile ? styles.playlistMobile : ''}`}>
      <div className={styles.header}>
        <div className={styles.title}>
          PLAYLIST <span className={styles.count}>({segments.length})</span>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <Checkbox
          label="autoplay next"
          checked={autoplayNext}
          onChange={(e) => setAutoplayNext(e.currentTarget.checked)}
          size="xs"
          color="orange"
        />
      </div>

      <div className={styles.scroll}>
        {segments.map((seg, i) => (
          <PlaylistRow
            key={seg.id || i}
            segment={seg}
            parsed={parsedSegments[i]}
            index={i}
            isActive={i === activeIdx}
            onClick={() => setActiveIdx(i)}
          />
        ))}
      </div>
    </aside>
  );
}
"""

# ---------------- src/components/Playlist/PlaylistRow.jsx ----------------
FILES["src/components/Playlist/PlaylistRow.jsx"] = """import { useEffect, useRef } from 'react';
import { formatTime } from '../../lib/time';
import styles from './Playlist.module.css';

export default function PlaylistRow({ segment, parsed, index, isActive, onClick }) {
  const rowRef = useRef(null);
  const duration = segment.end - segment.start;

  useEffect(() => {
    if (isActive && rowRef.current) {
      const el = rowRef.current;
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [isActive]);

  const dotClass =
    parsed.quality === 'good'
      ? styles.dotGood
      : parsed.quality === 'bad'
      ? styles.dotBad
      : styles.dotNeutral;

  return (
    <button
      ref={rowRef}
      onClick={onClick}
      className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
    >
      <span className={styles.rowIndex}>{index + 1}</span>
      <span className={`${styles.dot} ${dotClass}`} />
      <div className={styles.rowBody}>
        <div className={styles.rowLabel}>{parsed.title}</div>
        <div className={styles.rowTime}>
          {formatTime(segment.start)} / {formatTime(duration)}
        </div>
      </div>
    </button>
  );
}
"""

# ---------------- src/components/Playlist/Playlist.module.css ----------------
FILES["src/components/Playlist/Playlist.module.css"] = """.playlist {
  width: 288px;
  flex-shrink: 0;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.playlistMobile {
  width: 100%;
  border-left: none;
  border-top: 1px solid var(--border);
  flex: 1;
  overflow-y: auto;
}

.header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.title {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.06em;
}

.count {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 13px;
}

.toggleRow {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.scroll::-webkit-scrollbar {
  width: 6px;
}

.scroll::-webkit-scrollbar-track {
  background: transparent;
}

.scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  scroll-margin: 80px;
  color: inherit;
  font-family: inherit;
}

.row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.rowActive {
  background: rgba(255, 92, 26, 0.08);
  border-left-color: var(--orange);
}

.rowActive .rowLabel {
  color: #fff;
  font-weight: 600;
}

.rowIndex {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
  width: 24px;
  padding-top: 2px;
  flex-shrink: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.dotGood {
  background: var(--green);
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
}

.dotBad {
  background: var(--red);
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.5);
}

.dotNeutral {
  background: var(--gray-dot);
}

.rowBody {
  flex: 1;
  min-width: 0;
}

.rowLabel {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rowTime {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
  margin-top: 2px;
}
"""

# ---------------- src/components/ShortcutsModal/ShortcutsModal.jsx ----------------
FILES["src/components/ShortcutsModal/ShortcutsModal.jsx"] = """import { Modal } from '@mantine/core';
import styles from './ShortcutsModal.module.css';

const desktopShortcuts = [
  {
    title: 'Video',
    items: [
      ['Space', 'Play / pause'],
      ['← / →', 'Back / forward 1s (hold to repeat)'],
      [', / .', 'Frame back / forward'],
      ['Hold ⇧', '2× speed (while held)'],
      ['Hold ⌃', '0.5× speed (while held)'],
      ['J / K', 'Previous / next segment'],
      ['F', 'Toggle fullscreen']
    ]
  },
  {
    title: 'Other',
    items: [
      ['? / /', 'Toggle this overlay'],
      ['Esc', 'Close / exit fullscreen']
    ]
  }
];

const mobileGestures = [
  ['Tap', 'Show / hide controls'],
  ['Double-tap left', 'Back 1s'],
  ['Double-tap right', 'Forward 1s'],
  ['Long-press left', '0.5× speed (while held)'],
  ['Long-press right', '2× speed (while held)']
];

export default function ShortcutsModal({ open, onClose, isMobile }) {
  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={isMobile ? 'GESTURES' : 'KEYBOARD SHORTCUTS'}
      centered
      size="md"
      classNames={{ title: styles.modalTitle }}
    >
      {isMobile ? (
        <div>
          <div className={styles.sectionTitle}>VIDEO</div>
          <div className={styles.list}>
            {mobileGestures.map(([gesture, desc], i) => (
              <div key={i} className={styles.row}>
                <span className={styles.kbd} style={{ minWidth: 140 }}>{gesture}</span>
                <span className={styles.desc}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        desktopShortcuts.map((group, gi) => (
          <div key={gi} className={styles.group}>
            <div className={styles.sectionTitle}>{group.title}</div>
            <div className={styles.list}>
              {group.items.map(([key, desc], i) => (
                <div key={i} className={styles.row}>
                  <span className={styles.kbd}>{key}</span>
                  <span className={styles.desc}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </Modal>
  );
}
"""

# ---------------- src/components/ShortcutsModal/ShortcutsModal.module.css ----------------
FILES["src/components/ShortcutsModal/ShortcutsModal.module.css"] = """.modalTitle {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.06em;
}

.group {
  margin-bottom: 20px;
}

.sectionTitle {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.12em;
  color: var(--orange);
  margin-bottom: 12px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kbd {
  display: inline-block;
  padding: 2px 8px;
  background: #1a1a1a;
  color: var(--text);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-strong);
  min-width: 70px;
  text-align: center;
}

.desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
"""

# ---------------- src/components/VideoPlayer/VideoPlayer.jsx ----------------
FILES["src/components/VideoPlayer/VideoPlayer.jsx"] = """import { useState, useEffect, useRef, useCallback } from 'react';
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
          playsinline: 1
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e) => {
            if (e.data === 1) setIsPlaying(true);
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

  // Tick: poll currentTime + auto-pause at segment end
  useEffect(() => {
    if (!playerReady) return;
    tickRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime();
      setCurrentTime(t);
      if (activeSegment && t >= activeSegment.end - 0.05) {
        try {
          p.pauseVideo();
          p.seekTo(activeSegment.end, true);
        } catch (e) {}
      }
    }, 100);
    return () => clearInterval(tickRef.current);
  }, [playerReady, activeIdx, activeSegment]);

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
"""

# ---------------- src/components/VideoPlayer/TitleBar.jsx ----------------
FILES["src/components/VideoPlayer/TitleBar.jsx"] = """import styles from './VideoPlayer.module.css';

export default function TitleBar({ counterText, qualityDot, title, visible, onHelp }) {
  return (
    <div className={`${styles.titleBar} ${visible ? '' : styles.faded}`}>
      <span className={styles.titleCounter}>{counterText}</span>
      <span>{qualityDot}</span>
      <span className={styles.titleText}>{title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onHelp(); }}
        className={styles.helpBtn}
      >
        ?
      </button>
    </div>
  );
}
"""

# ---------------- src/components/VideoPlayer/ControlBar.jsx ----------------
FILES["src/components/VideoPlayer/ControlBar.jsx"] = """import { formatTime } from '../../lib/time';
import Seekbar from './Seekbar';
import styles from './VideoPlayer.module.css';

export default function ControlBar({
  isPlaying,
  onTogglePlay,
  currentTime,
  activeSegment,
  segDuration,
  segProgress,
  isDragging,
  seekbarRef,
  onSeekbarPointerDown,
  onToggleFullscreen,
  isFullscreen,
  visible
}) {
  return (
    <div
      className={`${styles.controlBar} ${visible ? '' : styles.faded}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className={styles.controlButton}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <span className={styles.timeDisplay}>
        {formatTime(currentTime - activeSegment.start)} / {formatTime(segDuration)}
      </span>

      <Seekbar
        seekbarRef={seekbarRef}
        progress={segProgress}
        isDragging={isDragging}
        onPointerDown={onSeekbarPointerDown}
      />

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
        className={styles.controlButton}
      >
        ⛶
      </button>
    </div>
  );
}
"""

# ---------------- src/components/VideoPlayer/Seekbar.jsx ----------------
FILES["src/components/VideoPlayer/Seekbar.jsx"] = """import styles from './VideoPlayer.module.css';

export default function Seekbar({ seekbarRef, progress, isDragging, onPointerDown }) {
  return (
    <div
      ref={seekbarRef}
      className={`${styles.seekbarTrack} ${isDragging ? styles.dragging : ''}`}
      onPointerDown={onPointerDown}
    >
      <div className={styles.seekbarFill} style={{ width: (progress * 100) + '%' }} />
      <div className={styles.seekbarThumb} style={{ left: (progress * 100) + '%' }} />
    </div>
  );
}
"""

# ---------------- src/components/VideoPlayer/SpeedIndicator.jsx ----------------
FILES["src/components/VideoPlayer/SpeedIndicator.jsx"] = """import styles from './VideoPlayer.module.css';

export default function SpeedIndicator({ rate }) {
  if (!rate) return null;
  return <div className={styles.speedPill}>{rate}×</div>;
}
"""

# ---------------- src/components/VideoPlayer/VideoPlayer.module.css ----------------
FILES["src/components/VideoPlayer/VideoPlayer.module.css"] = """.container {
  position: relative;
  background: #000;
  flex: 1;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 50;
  aspect-ratio: auto;
}

.iframeContainer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.iframeContainer iframe {
  width: 100%;
  height: 100%;
}

.tapZone {
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 10;
}

.faded {
  opacity: 0;
  pointer-events: none;
}

/* Title bar */
.titleBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
  transition: opacity 0.4s ease;
}

.titleCounter {
  font-family: var(--font-mono);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.titleText {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.helpBtn {
  margin-left: auto;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.helpBtn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

/* Fullscreen top-right */
.fsTopRight {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: opacity 0.4s ease;
}

.fsCounter {
  font-family: var(--font-mono);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
}

.fsButton {
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
}

.fsButton:hover {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
}

/* Mobile fullscreen top */
.mobileTopOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
}

.mobileCounter {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.mobileDot {
  font-size: 14px;
}

.mobileTitle {
  font-size: 14px;
  color: #fff;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobileButton {
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

/* Thin seekbar (mobile fullscreen) */
.thinSeekbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 15;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.thinSeekbarFill {
  height: 100%;
  background: var(--orange);
}

/* Control bar */
.controlBar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 24px 16px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
  transition: opacity 0.4s ease;
}

.controlButton {
  background: none;
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
  font-family: inherit;
}

.controlButton:hover {
  color: var(--orange);
}

.timeDisplay {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  width: 96px;
  flex-shrink: 0;
}

/* Seekbar */
.seekbarTrack {
  position: relative;
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  cursor: pointer;
  transition: height 0.15s;
}

.seekbarTrack:hover,
.seekbarTrack.dragging {
  height: 8px;
}

.seekbarFill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--orange);
  border-radius: 2px;
  pointer-events: none;
}

.seekbarThumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: var(--orange);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.seekbarTrack:hover .seekbarThumb,
.seekbarTrack.dragging .seekbarThumb {
  opacity: 1;
}

/* Speed pill */
.speedPill {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  z-index: 30;
  pointer-events: none;
  color: #fff;
}

/* Mobile help button (standard mode) */
.mobileHelpBtn {
  position: absolute;
  bottom: 12px;
  right: 56px;
  z-index: 25;
  background: none;
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
}
"""

# ============================================================
# Write all files
# ============================================================

def main():
    root = Path.cwd()
    print(f"Writing files into: {root}\n")

    for rel_path, content in FILES.items():
        full_path = root / rel_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding='utf-8')
        print(f"  ✓ {rel_path}")

    print(f"\n{len(FILES)} files written successfully.")
    print("\nNext steps:")
    print("  1. Make sure dependencies are installed: npm install")
    print("  2. Start dev server: npm run dev")

if __name__ == "__main__":
    main()
