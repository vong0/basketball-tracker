import { useRef, useCallback } from 'react';
import {
  LONG_PRESS_MS, SPEED_SLOW, SPEED_FAST,
  SWIPE_COMMIT_PX, SWIPE_VELOCITY_PX_MS, SWIPE_MIN_FLICK_PX, SWIPE_STALE_MS,
  SWIPE_MOVE_THRESHOLD_PX, SWIPE_EDGE_RESIST, SWIPE_EDGE_CAP_PX,
  SWIPE_SNAP_MS, SWIPE_COMMIT_MS, SWIPE_NEIGHBOR_GAP_PX,
} from '../constants';

const RESET_STATE = {
  pointerDown: false, startX: 0, startY: 0, startTime: 0,
  lastMoveX: 0, lastMoveTime: 0, dx: 0, swiping: false, side: null,
};

export function useSwipeGesture({ isMobile, activeIdx, navList, setActiveIdx, setRate, togglePlay }) {
  const swipeWrapRef = useRef(null);
  const longPressRef = useRef({ timer: null, active: false, side: null });
  const swipeStateRef = useRef({ ...RESET_STATE });

  const setSwipeOffset = (dx, animated) => {
    const wrap = swipeWrapRef.current;
    if (!wrap) return;
    wrap.style.transition = animated ? `transform ${SWIPE_SNAP_MS}ms ease-out` : 'none';
    wrap.style.transform = `translate3d(${dx}px, 0, 0)`;
  };

  const commitSwipe = useCallback((dir) => {
    let pos = navList.indexOf(activeIdx);
    if (pos === -1) pos = 0;
    const nextPos = pos + dir;
    const next = nextPos >= 0 && nextPos < navList.length ? navList[nextPos] : -1;
    if (next < 0) {
      setSwipeOffset(0, true);
      return;
    }
    const wrap = swipeWrapRef.current;
    if (!wrap) {
      setActiveIdx(next);
      return;
    }
    const containerW = wrap.parentElement?.clientWidth || window.innerWidth;
    const slideDistance = containerW + SWIPE_NEIGHBOR_GAP_PX;
    const targetDx = dir > 0 ? -slideDistance : slideDistance;
    wrap.style.transition = `transform ${SWIPE_COMMIT_MS}ms ease-out`;
    wrap.style.transform = `translate3d(${targetDx}px, 0, 0)`;
    // Commit segment change immediately so YT seeks in parallel with the animation.
    setActiveIdx(next);
    setTimeout(() => {
      const w = swipeWrapRef.current;
      if (w) {
        w.style.transition = 'none';
        w.style.transform = 'translate3d(0, 0, 0)';
      }
    }, SWIPE_COMMIT_MS);
  }, [activeIdx, navList, setActiveIdx]);

  const endLongPress = useCallback(() => {
    if (!isMobile) return false;
    if (longPressRef.current.timer) clearTimeout(longPressRef.current.timer);
    if (longPressRef.current.active) {
      longPressRef.current.timer = null;
      longPressRef.current.active = false;
      longPressRef.current.side = null;
      setRate(1);
      return true;
    }
    longPressRef.current.timer = null;
    return false;
  }, [isMobile, setRate]);

  // Factory: returns a pointerdown handler for the given side ('left' | 'right').
  const onPointerDown = useCallback((side) => (e) => {
    if (!isMobile) return;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY) || 0;
    swipeStateRef.current = {
      pointerDown: true, startX: clientX, startY: clientY,
      startTime: performance.now(), lastMoveX: clientX, lastMoveTime: performance.now(),
      dx: 0, swiping: false, side,
    };
    longPressRef.current.timer = setTimeout(() => {
      longPressRef.current.active = true;
      longPressRef.current.side = side;
      setRate(side === 'left' ? SPEED_SLOW : SPEED_FAST);
    }, LONG_PRESS_MS);
  }, [isMobile, setRate]);

  const onPointerMove = useCallback((e) => {
    if (!isMobile) return;
    const s = swipeStateRef.current;
    if (!s.pointerDown) return;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;
    const rawDx = clientX - s.startX;
    const rawDy = clientY - s.startY;
    if (!s.swiping) {
      if (Math.abs(rawDx) > SWIPE_MOVE_THRESHOLD_PX && Math.abs(rawDx) > Math.abs(rawDy)) {
        s.swiping = true;
        if (longPressRef.current.timer) {
          clearTimeout(longPressRef.current.timer);
          longPressRef.current.timer = null;
        }
      } else {
        return;
      }
    }
    let dx = rawDx;
    const navPos = navList.indexOf(activeIdx);
    const atStart = navPos <= 0;
    const atEnd = navPos === -1 || navPos >= navList.length - 1;
    if (atStart && dx > 0) dx = Math.min(dx * SWIPE_EDGE_RESIST, SWIPE_EDGE_CAP_PX);
    if (atEnd && dx < 0) dx = Math.max(dx * SWIPE_EDGE_RESIST, -SWIPE_EDGE_CAP_PX);
    s.dx = dx;
    s.lastMoveX = clientX;
    s.lastMoveTime = performance.now();
    setSwipeOffset(dx, false);
  }, [isMobile, activeIdx, navList]);

  const onPointerUp = useCallback(() => {
    if (!isMobile) return;
    const s = swipeStateRef.current;
    const wasSwiping = s.swiping;
    const dx = s.dx;
    swipeStateRef.current = { ...RESET_STATE };

    if (wasSwiping) {
      const upTime = performance.now();
      const moveDt = upTime - s.lastMoveTime;
      const velocity = moveDt < SWIPE_STALE_MS && moveDt >= 0
        ? Math.abs(s.lastMoveX - s.startX) / (s.lastMoveTime - s.startTime || 1)
        : 0;
      const velocityCommit = velocity > SWIPE_VELOCITY_PX_MS && Math.abs(dx) > SWIPE_MIN_FLICK_PX;
      if (Math.abs(dx) > SWIPE_COMMIT_PX || velocityCommit) {
        commitSwipe(dx > 0 ? -1 : 1);
      } else {
        setSwipeOffset(0, true);
      }
      return;
    }
    if (endLongPress()) return;
    togglePlay();
  }, [isMobile, commitSwipe, endLongPress, togglePlay]);

  const onPointerCancel = useCallback(() => {
    const s = swipeStateRef.current;
    if (s.swiping) setSwipeOffset(0, true);
    swipeStateRef.current = { ...RESET_STATE };
    endLongPress();
  }, [endLongPress]);

  return {
    swipeWrapRef,
    swipeHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    endLongPress,
  };
}
