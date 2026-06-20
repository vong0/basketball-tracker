import { useEffect } from 'react';

export function usePlaylistScroll(isActive, rowRef) {
  useEffect(() => {
    if (!isActive || !rowRef.current) return;
    const el = rowRef.current;
    const parent = el.parentElement;
    if (parent) {
      const rect = el.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      if (rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps
}
