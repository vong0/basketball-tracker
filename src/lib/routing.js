/**

 * Tiny hash router. No deps.
 *   #/            -> { view: 'landing' }
 *   #/game/<id>   -> { view: 'game', gameId: '<id>' }
 *   #/takeaways   -> { view: 'takeaways' }
 * Anything else falls back to landing.
 */
export function parseHash() {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  const m = h.match(/^#\/game\/([\w-]+)$/);
  if (m) return { view: 'game', gameId: m[1] };
  if (h === '#/takeaways') return { view: 'takeaways' };
  if (h === '#/strategies') return { view: 'strategies' };
  return { view: 'landing' };
}

export function navigate(hash) {
  if (typeof window === 'undefined') return;
  window.location.hash = hash.startsWith('#') ? hash : ('#' + hash);
}
