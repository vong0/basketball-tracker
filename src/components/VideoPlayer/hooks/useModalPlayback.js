import { useRef, useCallback } from 'react';

export function useModalPlayback({ ytPlayerRef, isPlaying }) {
  const wasPlayingBeforeModalRef = useRef(false);
  const modalSuppressPlayRef = useRef(false);

  const pauseAndRemember = useCallback(() => {
    const p = ytPlayerRef.current;
    // Use the YT player's own state (1 = playing) rather than React's isPlaying
    // which can lag by a tick — that lag was causing popovers to record
    // wasPlayingBeforeModal = false even when video was actually playing.
    let wasPlaying = isPlaying;
    try {
      if (p && p.getPlayerState && p.getPlayerState() === 1) wasPlaying = true;
    } catch (e) {}
    wasPlayingBeforeModalRef.current = wasPlaying;
    modalSuppressPlayRef.current = true;
    if (p && p.pauseVideo) {
      try { p.pauseVideo(); } catch (e) {}
      // Defensive re-pause: YT occasionally auto-resumes after a state-change event.
      setTimeout(() => { try { p.pauseVideo(); } catch (e) {} }, 50);
    }
  }, [isPlaying, ytPlayerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const resumeIfWasPlaying = useCallback(() => {
    modalSuppressPlayRef.current = false;
    const p = ytPlayerRef.current;
    if (p && p.playVideo && wasPlayingBeforeModalRef.current) {
      try { p.playVideo(); } catch (e) {}
    }
    wasPlayingBeforeModalRef.current = false;
  }, [ytPlayerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return { pauseAndRemember, resumeIfWasPlaying, modalSuppressPlayRef };
}
