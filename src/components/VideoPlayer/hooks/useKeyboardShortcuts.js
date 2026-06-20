import { useRef, useCallback, useEffect } from 'react';
import { SPEED_FAST, SPEED_SLOW, CLICK_DEBOUNCE_MS, SEEK_DELTA_SECONDS } from '../constants';

export function useKeyboardShortcuts({
  isMobile, togglePlay, seekDelta, navSegment, toggleFullscreen,
  setRate, showInfo, handleOpenInfo, handleCloseInfo, cutSegmentsLength,
}) {
  const speedKeyRef = useRef({ shift: false, ctrl: false });
  const clickTimerRef = useRef(null);

  const resetSpeedKeys = useCallback(() => {
    if (speedKeyRef.current.shift || speedKeyRef.current.ctrl) {
      speedKeyRef.current = { shift: false, ctrl: false };
      setRate(1);
    }
  }, [setRate]);

  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // 'i' toggles the info dialog — must run BEFORE the showInfo guard
      // so it can close the dialog when open.
      if ((e.key === 'i' || e.key === 'I') && cutSegmentsLength > 0) {
        e.preventDefault();
        if (showInfo) handleCloseInfo();
        else handleOpenInfo();
        return;
      }
      if (showInfo) return;
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen?.();
        return;
      }
      if (e.key === 'Shift' && !speedKeyRef.current.shift) {
        speedKeyRef.current.shift = true; setRate(SPEED_FAST); return;
      }
      if (e.key === 'Control' && !speedKeyRef.current.ctrl) {
        speedKeyRef.current.ctrl = true; setRate(SPEED_SLOW); return;
      }
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); seekDelta(-SEEK_DELTA_SECONDS); break;
        case 'ArrowRight': e.preventDefault(); seekDelta(SEEK_DELTA_SECONDS); break;
        case 'j': case 'J': e.preventDefault(); navSegment(-1); break;
        case 'k': case 'K': e.preventDefault(); navSegment(1); break;
        case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift' && speedKeyRef.current.shift) { speedKeyRef.current.shift = false; setRate(1); }
      if (e.key === 'Control' && speedKeyRef.current.ctrl) { speedKeyRef.current.ctrl = false; setRate(1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile, togglePlay, seekDelta, navSegment, toggleFullscreen, setRate, showInfo, cutSegmentsLength, handleOpenInfo, handleCloseInfo]);

  // Debounced single-click — cancelled by double-click (desktop only).
  const handleTapZoneClick = useCallback(() => {
    if (clickTimerRef.current) return;
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      togglePlay();
    }, CLICK_DEBOUNCE_MS);
  }, [togglePlay]);

  const handleTapZoneDoubleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    toggleFullscreen();
  }, [toggleFullscreen]);

  return { handleTapZoneClick, handleTapZoneDoubleClick, resetSpeedKeys };
}
