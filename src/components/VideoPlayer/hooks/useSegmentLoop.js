import { useState, useEffect, useRef } from 'react';
import { LOOP_LEAD } from '../constants';

export function useSegmentLoop({ ytPlayerRef, playerReady, activeIdx, activeSegment }) {
  const [currentTime, setCurrentTime] = useState(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!playerReady) return;
    const tick = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime();
      if (!isDraggingRef.current) setCurrentTime(t);
      if (activeSegment && t >= activeSegment.end - LOOP_LEAD && t > activeSegment.start + 0.5) {
        try { p.seekTo(activeSegment.start, true); } catch (e) {}
      }
    }, 100);
    return () => clearInterval(tick);
  }, [playerReady, activeIdx, activeSegment]); // eslint-disable-line react-hooks/exhaustive-deps

  return { currentTime, setCurrentTime, isDraggingRef };
}
