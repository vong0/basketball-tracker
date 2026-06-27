import { useState, useEffect, useRef, useCallback } from 'react';
import { loadYouTubeAPI } from '../../../lib/youtube';
import * as pool from '../lib/iframePool';
import { YT_IFRAME_WIDTH, YT_IFRAME_HEIGHT } from '../lib/constants';

export function useYouTubePlayer({ videoId, isMobile, isFullscreen }) {
  const ytPlayerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const iframeScaleWrapRef = useRef(null);
  const hasPlayedOnceRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerReadySeq, setPlayerReadySeq] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState(1);

  // markReady: increments playerReadySeq + sets playerReady. Both state setters
  // are stable across renders (React guarantee), so useCallback needs no deps.
  // The seq counter ensures the seek effect in VideoPlayer fires on every fresh
  // attach, even if playerReady was already true due to React 18 batching.
  const markReady = useCallback(() => {
    setPlayerReadySeq(s => s + 1);
    setPlayerReady(true);
  }, []);

  useEffect(() => {
    if (!videoId) return;

    if (isMobile) {
      // Mobile: create/destroy per videoId — scale trick needs iframeScaleWrapRef
      let cancelled = false;
      loadYouTubeAPI().then((YT) => {
        if (cancelled) return;
        const mountTarget = iframeScaleWrapRef.current || iframeContainerRef.current;
        if (!mountTarget) return;
        mountTarget.innerHTML = '';
        const div = document.createElement('div');
        div.id = 'yt-player-' + Math.random().toString(36).slice(2);
        mountTarget.appendChild(div);

        const forceSize = () => {
          const iframe = mountTarget.querySelector('iframe');
          if (iframe) {
            iframe.style.background = '#000';
            iframe.setAttribute('width', String(YT_IFRAME_WIDTH));
            iframe.setAttribute('height', String(YT_IFRAME_HEIGHT));
            iframe.style.width = YT_IFRAME_WIDTH + 'px';
            iframe.style.height = YT_IFRAME_HEIGHT + 'px';
          }
        };
        forceSize();
        setTimeout(forceSize, 0);
        setTimeout(forceSize, 300);

        ytPlayerRef.current = new YT.Player(div.id, {
          videoId,
          playerVars: {
            controls: 0, rel: 0, fs: 0, disablekb: 1,
            iv_load_policy: 3, playsinline: 1, vq: 'hd1080',
          },
          events: {
            onReady: (e) => {
              try { e.target.mute(); } catch (err) {}
              if (!cancelled) markReady();
            },
            onStateChange: (e) => {
              if (cancelled) return;
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
        setPlayerReady(false);
        hasPlayedOnceRef.current = false;
        if (ytPlayerRef.current?.destroy) {
          try { ytPlayerRef.current.destroy(); } catch (e) {}
          ytPlayerRef.current = null;
        }
      };

    } else {
      // Desktop: LRU pool — iframe stays alive across videoId switches

      const slot = pool.acquire(videoId);
      pool.attach(slot, iframeContainerRef.current);

      // Set ytPlayerRef immediately if player was already created.
      // This matches original behaviour: ytPlayerRef.current is set as soon as
      // new YT.Player() is called, NOT waiting for onReady. Controls work right away.
      if (slot.player) ytPlayerRef.current = slot.player;
      if (slot.ready) markReady();
      else setPlayerReady(false);

      hasPlayedOnceRef.current = slot.hasPlayedOnce;
      // Always start loading on fresh attach so the black blocker shows until
      // the first play event, regardless of whether the slot is warm or cold.
      setInitialLoading(true);

      const cleanups = [
        // 'created' fires when slot.player is first assigned (async YT load case).
        // If YT was already loaded, slot.player is set synchronously in acquire()
        // and we handled it above; this listener handles the deferred case.
        pool.addListener(slot, 'created', (player) => {
          ytPlayerRef.current = player;
        }),
        pool.addListener(slot, 'ready', markReady),
        pool.addListener(slot, 'state', (data) => {
          if (data === 1) {
            setIsPlaying(true);
            if (!hasPlayedOnceRef.current) hasPlayedOnceRef.current = true;
            setInitialLoading(false);  // clear blocker on every play after mount
          } else if (data === 2 || data === 0) {
            setIsPlaying(false);
          }
        }),
        pool.addListener(slot, 'rate', (rate) => setCurrentRate(rate)),
      ];

      return () => {
        cleanups.forEach(c => c());
        setPlayerReady(false);
        ytPlayerRef.current = null;
        hasPlayedOnceRef.current = false;
        pool.detach(slot);
      };
    }
  }, [videoId, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRate = useCallback((rate) => {
    const p = ytPlayerRef.current;
    if (!p || !p.setPlaybackRate) return;
    try { p.setPlaybackRate(rate); } catch (e) {}
    setCurrentRate(rate);
  }, []);

  // Mobile only: scale the fixed-size iframe to COVER the container.
  // Tricks YouTube into serving HD; crops overflow edge-to-edge.
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
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMobile, isFullscreen, playerReady]);

  return {
    ytPlayerRef,
    playerReady,
    playerReadySeq,
    isPlaying,
    initialLoading,
    currentRate,
    setRate,
    iframeContainerRef,
    iframeScaleWrapRef,
  };
}
