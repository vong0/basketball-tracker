import { useState, useRef, useCallback } from 'react';

export function useSeekDrag({ activeSegment, isPlaying, ytPlayerRef, setCurrentTime, isDraggingRef }) {
  const [isDragging, setIsDragging] = useState(false);
  const seekThrottleRef = useRef(0);

  const computeSeekTime = useCallback((e, barRef) => {
    const node = barRef?.current;
    if (!node || !activeSegment) return null;
    const rect = node.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return null;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const duration = activeSegment.end - activeSegment.start;
    return activeSegment.start + pct * duration;
  }, [activeSegment]);

  const handleMove = useCallback((e, barRef) => {
    const newTime = computeSeekTime(e, barRef);
    if (newTime === null) return;
    setCurrentTime(newTime);
    const now = performance.now();
    if (now - seekThrottleRef.current >= 50) {
      seekThrottleRef.current = now;
      const p = ytPlayerRef.current;
      if (p && p.seekTo) try { p.seekTo(newTime, false); } catch (err) {}
    }
  }, [computeSeekTime, setCurrentTime, ytPlayerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generic factory: returns a pointerdown handler bound to the given bar ref.
  // Deduplicates the near-identical seekbar and reel handlers from the original.
  const makePointerDownHandler = useCallback((barRef) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.pointerId !== undefined && e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
    const wasPlaying = isPlaying;
    setIsDragging(true);
    isDraggingRef.current = true;
    seekThrottleRef.current = 0;
    handleMove(e, barRef);
    const onMove = (ev) => handleMove(ev, barRef);
    const onUp = (ev) => {
      const finalTime = computeSeekTime(ev, barRef);
      const p = ytPlayerRef.current;
      if (finalTime !== null) {
        setCurrentTime(finalTime);
        if (p && p.seekTo) try { p.seekTo(finalTime, true); } catch (err) {}
      }
      if (wasPlaying && p && p.playVideo) {
        try { p.playVideo(); } catch (err) {}
      }
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [isPlaying, handleMove, computeSeekTime, ytPlayerRef, setCurrentTime, isDraggingRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return { makePointerDownHandler, isDragging, setIsDragging };
}
