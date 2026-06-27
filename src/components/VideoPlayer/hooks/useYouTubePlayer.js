import { useState, useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '../../../lib/youtube';
import { YT_IFRAME_WIDTH, YT_IFRAME_HEIGHT } from '../lib/constants';

export function useYouTubePlayer({ videoId, isMobile, isFullscreen }) {
  const ytPlayerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const iframeScaleWrapRef = useRef(null);
  const playerIsMobileRef = useRef(null);
  const unmountedRef = useRef(false);
  // Ref mirror of playerReady — updated synchronously so effects in the same
  // flush can read the correct value before the state update causes a re-render.
  const playerReadyRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerReadySeq, setPlayerReadySeq] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRate, setCurrentRate] = useState(1);

  const markReady = useCallback(() => {
    playerReadyRef.current = true;
    setPlayerReadySeq(s => s + 1);
    setPlayerReady(true);
  }, []);

  // Always destroy and recreate the player when videoId or isMobile changes.
  // loadVideoById (reuse existing player) was tried but proved unreliable: the
  // seek to the clip start always lost the race against YouTube's own autoplay,
  // regardless of whether the seek was dispatched via React effects or directly
  // in onStateChange. The creation path (onReady → markReady → seek effect) is
  // proven reliable and is the only path used for single-video mode.
  useEffect(() => {
    if (!videoId) {
      if (ytPlayerRef.current?.pauseVideo) try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
      setIsPlaying(false);
      return;
    }

    // Destroy any existing player before creating a new one.
    playerReadyRef.current = false;
    if (ytPlayerRef.current?.destroy) {
      try { ytPlayerRef.current.destroy(); } catch (e) {}
      ytPlayerRef.current = null;
    }
    setPlayerReady(false);
    setIsPlaying(false);

    let cancelled = false;
    const mountTarget = isMobile
      ? (iframeScaleWrapRef.current || iframeContainerRef.current)
      : iframeContainerRef.current;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || unmountedRef.current || !mountTarget) return;

      if (isMobile) {
        mountTarget.innerHTML = '';
        const forceSize = () => {
          const iframe = mountTarget.querySelector('iframe');
          if (!iframe) return;
          iframe.style.background = '#000';
          iframe.setAttribute('width', String(YT_IFRAME_WIDTH));
          iframe.setAttribute('height', String(YT_IFRAME_HEIGHT));
          iframe.style.width = YT_IFRAME_WIDTH + 'px';
          iframe.style.height = YT_IFRAME_HEIGHT + 'px';
        };
        forceSize();
        setTimeout(forceSize, 0);
        setTimeout(forceSize, 300);
      }

      const div = document.createElement('div');
      div.id = 'yt-player-' + Math.random().toString(36).slice(2);
      mountTarget.appendChild(div);

      playerIsMobileRef.current = isMobile;

      ytPlayerRef.current = new YT.Player(div.id, {
        videoId,
        ...(isMobile ? { width: YT_IFRAME_WIDTH, height: YT_IFRAME_HEIGHT } : {}),
        playerVars: {
          controls: 0, rel: 0, fs: 0, disablekb: 1,
          iv_load_policy: 3, playsinline: 1, vq: 'hd1080',
        },
        events: {
          // unmountedRef guards all callbacks — it's only true after component unmount,
          // NOT after videoId changes (unlike the old `cancelled` variable which was set
          // on every videoId change cleanup, silently breaking all subsequent events).
          onReady: (e) => {
            if (unmountedRef.current) return;
            try { e.target.mute(); } catch (err) {}
            markReady();
          },
          onStateChange: (e) => {
            if (unmountedRef.current) return;
            if (e.data === 1) setIsPlaying(true);
            else if (e.data === 2 || e.data === 0) setIsPlaying(false);
          },
          onPlaybackRateChange: (e) => {
            if (!unmountedRef.current) setCurrentRate(e.data);
          },
        },
      });
    });

    return () => { cancelled = true; };
  }, [videoId, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Destroy player on component unmount.
  useEffect(() => {
    unmountedRef.current = false; // reset on (re)mount — handles StrictMode double-invoke
    return () => {
      unmountedRef.current = true;
      playerReadyRef.current = false;
      setPlayerReady(false);
      setIsPlaying(false);
      playerIsMobileRef.current = null;
      if (ytPlayerRef.current?.destroy) {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
        ytPlayerRef.current = null;
      }
    };
  }, []);

  const setRate = useCallback((rate) => {
    const p = ytPlayerRef.current;
    if (!p || !p.setPlaybackRate) return;
    try { p.setPlaybackRate(rate); } catch (e) {}
    setCurrentRate(rate);
  }, []);

  // Mobile only: scale fixed-size iframe to COVER the container (HD trick).
  useEffect(() => {
    if (!isMobile) return;
    const recompute = () => {
      const wrap = iframeScaleWrapRef.current;
      const container = iframeContainerRef.current;
      if (!wrap || !container) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;
      const scale = Math.max(cw / YT_IFRAME_WIDTH, ch / YT_IFRAME_HEIGHT);
      const scaledW = YT_IFRAME_WIDTH * scale;
      const scaledH = YT_IFRAME_HEIGHT * scale;
      wrap.style.transform = 'scale(' + scale + ')';
      wrap.style.left = ((cw - scaledW) / 2) + 'px';
      wrap.style.top = ((ch - scaledH) / 2) + 'px';
      const iframe = wrap.querySelector('iframe');
      if (iframe) {
        iframe.setAttribute('width', String(YT_IFRAME_WIDTH));
        iframe.setAttribute('height', String(YT_IFRAME_HEIGHT));
        iframe.style.width = YT_IFRAME_WIDTH + 'px';
        iframe.style.height = YT_IFRAME_HEIGHT + 'px';
        iframe.style.background = '#000';
      }
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (iframeContainerRef.current) ro.observe(iframeContainerRef.current);
    window.addEventListener('resize', recompute);
    document.addEventListener('fullscreenchange', recompute);
    const t1 = setTimeout(recompute, 100);
    const t2 = setTimeout(recompute, 500);
    const t3 = setTimeout(recompute, 1000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
      document.removeEventListener('fullscreenchange', recompute);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [isMobile, isFullscreen, playerReady]);

  return {
    ytPlayerRef,
    playerReadyRef,
    playerReady,
    playerReadySeq,
    isPlaying,
    currentRate,
    setRate,
    iframeContainerRef,
    iframeScaleWrapRef,
  };
}
