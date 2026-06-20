/**

 * Tiny hash router. No deps.
 *   #/            -> { view: 'landing' }
 *   #/game/<id>   -> { view: 'game', gameId: '<id>' }
 *   #/takeaways   -> { view: 'takeaways' }
 * Anything else falls back to landing.
 */
export function parseHash() {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  if (h === '#/games') return { view: 'games' };
  const m = h.match(/^#\/game\/([\w-]+)$/);
  if (m) return { view: 'game', gameId: m[1] };
  if (h === '#/takeaways') return { view: 'takeaways' };
  if (h === '#/strategies') return { view: 'strategies' };
  if (h === '#/opponents') return { view: 'opponents' };
  const oppM = h.match(/^#\/opponents\/([\w-]+)$/);
  if (oppM) return { view: 'opponent', teamId: oppM[1] };
  return { view: 'landing' };
}

export function navigate(hash) {
  if (typeof window === 'undefined') return;
  window.location.hash = hash.startsWith('#') ? hash : ('#' + hash);
}
