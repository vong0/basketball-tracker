// This is for JavaScript behaviour only (gesture handlers, orientation lock,
// YouTube iframe sizing). Do not use for layout decisions — use CSS media queries instead.
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(max-width: 900px)').matches ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')
  );
}
