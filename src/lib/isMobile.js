export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(max-width: 900px)').matches ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')
  );
}
