import { useState, useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '../../../lib/youtube';
import { YT_IFRAME_WIDTH, YT_IFRAME_HEIGHT } from '../constants';

export function useYouTubePlayer({ videoId, isMobile, isFullscreen }) {
  const ytPlayerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const iframeScaleWrapRef = useRef(null);
  const hasPlayedOnceRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState(1);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      const div = document.createElement('div');
      div.id = 'yt-player-' + Math.random().toString(36).slice(2);
      // On mobile, mount inside the scale wrapper so the fixed-size iframe
      // gets scaled. On desktop, mount directly in the container.
      const mountTarget = (isMobile && iframeScaleWrapRef.current)
        ? iframeScaleWrapRef.current
        : iframeContainerRef.current;
      if (mountTarget) {
        mountTarget.innerHTML = '';
        mountTarget.appendChild(div);
        // Force iframe to fill the wrapper after YT creates it.
        // YT sets width/height HTML attributes (640x360) that override CSS.
        const forceSize = () => {
          const iframe = mountTarget.querySelector('iframe');
          if (iframe) {
            iframe.style.background = '#000';
            if (isMobile) {
              iframe.setAttribute('width', String(YT_IFRAME_WIDTH));
              iframe.setAttribute('height', String(YT_IFRAME_HEIGHT));
              iframe.style.width = YT_IFRAME_WIDTH + 'px';
              iframe.style.height = YT_IFRAME_HEIGHT + 'px';
            } else {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
            }
          }
        };
        forceSize();
        setTimeout(forceSize, 0);
        setTimeout(forceSize, 300);
      }
      ytPlayerRef.current = new YT.Player(div.id, {
        videoId,
        playerVars: {
          controls: 0, rel: 0, fs: 0, disablekb: 1,
          iv_load_policy: 3, playsinline: 1, vq: 'hd1080',
        },
        events: {
          onReady: (e) => {
            // Always mute on ready — mobile browsers require muted for autoplay.
            try { e.target.mute(); } catch (err) {}
            setPlayerReady(true);
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              setIsPlaying(true);
              if (!hasPlayedOnceRef.current) {
                hasPlayedOnceRef.current = true;
                setInitialLoading(false);
              }
            } else if (e.data === 2 || e.data === 0) {
              setIsPlaying(false);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
        ytPlayerRef.current = null;
      }
    };
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRate = useCallback((rate) => {
    const p = ytPlayerRef.current;
    if (!p || !p.setPlaybackRate) return;
    try { p.setPlaybackRate(rate); } catch (e) {}
    setCurrentRate(rate);
  }, []);

  // Mobile only: scale the YT_IFRAME_WIDTH×YT_IFRAME_HEIGHT iframe to COVER the
  // container. Tricks YouTube into serving HD because it sees a large player,
  // and crops overflow so video fills edge-to-edge.
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
    // Multiple deferred recomputes — fullscreen + iframe load both settle late.
    const t1 = setTimeout(recompute, 100);
    const t2 = setTimeout(recompute, 500);
    const t3 = setTimeout(recompute, 1000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
      document.removeEventListener('fullscreenchange', recompute);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMobile, isFullscreen, playerReady]);

  return {
    ytPlayerRef,
    playerReady,
    isPlaying,
    initialLoading,
    currentRate,
    setRate,
    iframeContainerRef,
    iframeScaleWrapRef,
  };
}
