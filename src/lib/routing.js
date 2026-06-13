/**

 * Tiny hash router. No deps.
 *   #/            -> { view: 'landing' }
 *   #/game/<id>   -> { view: 'game', gameId: '<id>' }
 * Anything else falls back to landing.
 */
export function parseHash() {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  const m = h.match(/^#\/game\/([\w-]+)$/);
  if (m) return { view: 'game', gameId: m[1] };
  return { view: 'landing' };
}

export function navigate(hash) {
  if (typeof window === 'undefined') return;
  // Allow callers to pass either '#/foo' or '/foo'.
  window.location.hash = hash.startsWith('#') ? hash : ('#' + hash);
}
