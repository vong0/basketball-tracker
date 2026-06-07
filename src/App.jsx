import { useState, useRef, useCallback, useEffect } from 'react';
import YouTube from 'react-youtube';
import {
  MantineProvider,
  Container,
  Card,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  Loader,
  AspectRatio,
  Box,
  Slider,
  createTheme,
} from '@mantine/core';
import '@mantine/core/styles.css';

// ---------- helpers ----------
const getVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ---------- theme ----------
const theme = createTheme({
  primaryColor: 'red',
  fontFamily: 'Inter, sans-serif',
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { radius: 'lg', shadow: 'xl' } },
  },
});

// ---------- component ----------
export default function App() {
  const playerRef = useRef(null);
  const tickIntervalRef = useRef(null);

  const [gameData, setGameData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Load game JSON on mount
  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/games/y26-divA-game1.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
        return r.json();
      })
      .then(setGameData)
      .catch((err) => setLoadError(err.message));
  }, []);

  const clearTick = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTick, [clearTick]);

  const onReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
  };

  const onStateChange = (event) => {
    // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    if (event.data === 1) setIsPlaying(true);
    if (event.data === 2 || event.data === 0) setIsPlaying(false);
  };

  // Continuous time tracker — runs while a segment is active
  const startTick = useCallback(
    (seg) => {
      clearTick();
      tickIntervalRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        const t = player.getCurrentTime();
        setCurrentTime(t);
        // Auto-pause at segment end
        if (seg && t >= seg.end) {
          player.pauseVideo();
          setIsPlaying(false);
        }
      }, 100);
    },
    [clearTick]
  );

  const playSegment = (seg) => {
    const player = playerRef.current;
    if (!player) return;

    setActiveSegment(seg);
    setCurrentTime(seg.start);

    player.seekTo(seg.start, true);
    player.playVideo();

    startTick(seg);
  };

  const togglePlayPause = () => {
    const player = playerRef.current;
    if (!player || !activeSegment) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      // If we're at or past the end, restart from beginning of segment
      const t = player.getCurrentTime();
      if (t >= activeSegment.end || t < activeSegment.start) {
        player.seekTo(activeSegment.start, true);
      }
      player.playVideo();
    }
  };

  const skip = (seconds) => {
    const player = playerRef.current;
    if (!player || !activeSegment) return;
    const current = player.getCurrentTime();
    let newTime = current + seconds;
    newTime = Math.max(activeSegment.start, Math.min(activeSegment.end, newTime));
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const step = (direction = 1) => {
    const player = playerRef.current;
    if (!player || !activeSegment) return;
    const frameDuration = 1 / 30;
    const current = player.getCurrentTime();
    let newTime = current + direction * frameDuration;
    newTime = Math.max(activeSegment.start, Math.min(activeSegment.end, newTime));
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleStop = () => {
    playerRef.current?.pauseVideo();
    setIsPlaying(false);
    clearTick();
    setActiveSegment(null);
  };

  const handleSeek = (value) => {
    const player = playerRef.current;
    if (!player || !activeSegment) return;
    player.seekTo(value, true);
    setCurrentTime(value);
  };

  // ---------- render ----------
  if (loadError) {
    return (
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Container size="md" py="xl">
          <Card withBorder>
            <Title order={3} c="red">Failed to load game data</Title>
            <Text mt="sm">{loadError}</Text>
          </Card>
        </Container>
      </MantineProvider>
    );
  }

  if (!gameData) {
    return (
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Container size="md" py="xl">
          <Group justify="center"><Loader /></Group>
        </Container>
      </MantineProvider>
    );
  }

  const videoId = getVideoId(gameData.game.youtubeUrl);
  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      controls: 0,        // HIDE YouTube's seek bar / controls
      modestbranding: 1,
      rel: 0,
      autoplay: 0,
      disablekb: 1,
      fs: 0,              // disable native fullscreen button
      iv_load_policy: 3,  // hide annotations
      playsinline: 1,
    },
  };

  // Compute progress within the active segment
  const segDuration = activeSegment ? activeSegment.end - activeSegment.start : 0;
  const segProgress = activeSegment
    ? Math.max(0, Math.min(segDuration, currentTime - activeSegment.start))
    : 0;

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Container size="md" py="xl">
        <Card p="xl" withBorder>
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} ta="center" c="red.5">
                🏀 {gameData.game.id}
              </Title>
              <Text ta="center" size="sm" c="dimmed">
                {gameData.game.date} · vs {gameData.game.opponent} · {gameData.game.result}
              </Text>
              <Text ta="center" size="xs" c={playerReady ? 'green' : 'yellow'}>
                {playerReady ? '● player ready' : '○ loading player...'}
              </Text>
            </Stack>

            {/* Video — YouTube controls hidden, overlay blocks pointer events on iframe */}
            <Box style={{ width: '100%', maxWidth: 800, margin: '0 auto', position: 'relative' }}>
              <AspectRatio ratio={16 / 9}>
                {videoId ? (
                  <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={onReady}
                    onStateChange={onStateChange}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Box bg="dark.6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text c="dimmed">No video URL</Text>
                  </Box>
                )}
              </AspectRatio>
              {/* Transparent overlay prevents clicking the video (which would pause it via YouTube's default click-to-pause) */}
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: 'pointer',
                }}
                onClick={togglePlayPause}
              />
            </Box>

            {/* Custom segment seek bar */}
            {activeSegment && (
              <Stack gap={4} px="sm">
                <Slider
                  value={segProgress}
                  onChange={(v) => handleSeek(activeSegment.start + v)}
                  min={0}
                  max={segDuration}
                  step={0.1}
                  label={(v) => fmt(activeSegment.start + v)}
                  color="red"
                  size="md"
                />
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" ff="monospace">
                    {fmt(currentTime)} / {fmt(activeSegment.end)}
                  </Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    segment: {fmt(activeSegment.start)} – {fmt(activeSegment.end)}
                    {' '}({segDuration.toFixed(1)}s)
                  </Text>
                </Group>
              </Stack>
            )}

            {activeSegment && (
              <Badge
                size="lg"
                variant="light"
                color={isPlaying ? 'green' : 'yellow'}
                style={{ alignSelf: 'center' }}
              >
                {activeSegment.label}
                {isPlaying ? ' ▶' : ' ⏸'}
              </Badge>
            )}

            <Stack gap="xs">
              {gameData.segments.map((seg) => (
                <Button
                  key={seg.id}
                  variant={activeSegment?.id === seg.id ? 'filled' : 'outline'}
                  color={activeSegment?.id === seg.id ? 'red' : 'gray'}
                  onClick={() => playSegment(seg)}
                  disabled={!playerReady}
                  fullWidth
                  justify="space-between"
                  leftSection={<Text size="sm" style={{ textAlign: 'left' }}>{seg.label}</Text>}
                  rightSection={
                    <Text size="xs" c="dimmed">
                      {fmt(seg.start)} – {fmt(seg.end)}
                    </Text>
                  }
                />
              ))}
            </Stack>

            <Group justify="center" gap="xs" mt="md">
              <Tooltip label="Frame back">
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => step(-1)}
                  disabled={!activeSegment}
                >
                  ⏪
                </ActionIcon>
              </Tooltip>

              <Button
                variant="light"
                color="gray"
                size="compact-sm"
                onClick={() => skip(-5)}
                disabled={!activeSegment}
              >
                -5s
              </Button>

              <Button
                variant="filled"
                color="blue"
                size="compact-md"
                onClick={togglePlayPause}
                disabled={!activeSegment}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </Button>

              <Button
                variant="filled"
                color="red"
                size="compact-md"
                onClick={handleStop}
                disabled={!activeSegment}
              >
                ⏹ Stop
              </Button>

              <Button
                variant="light"
                color="gray"
                size="compact-sm"
                onClick={() => skip(5)}
                disabled={!activeSegment}
              >
                +5s
              </Button>

              <Tooltip label="Frame forward">
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => step(1)}
                  disabled={!activeSegment}
                >
                  ⏩
                </ActionIcon>
              </Tooltip>
            </Group>

            <Text size="xs" c="dimmed" ta="center">
              Click a segment to play. Click the video to play/pause. Seek bar only spans the active segment.
            </Text>
          </Stack>
        </Card>
      </Container>
    </MantineProvider>
  );
}
