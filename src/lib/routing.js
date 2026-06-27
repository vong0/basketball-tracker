/**
 * Tiny hash router. No deps.
 *   #/            -> { view: 'landing' }
 *   #/games       -> { view: 'games' }
 *   #/games/<id>  -> { view: 'gameDetail', gameId: '<id>' }
 *   #/game/<id>   -> { view: 'game', gameId: '<id>' }
 *   #/players     -> { view: 'players' }
 *   #/players/<id> -> { view: 'playerDetail', playerId: '<id>' }
 *   #/takeaways   -> { view: 'takeaways' }
 *   ...
 * Anything else falls back to landing.
 */
export function parseHash() {
  const h = typeof window !== 'undefined' ? window.location.hash : '';
  if (h === '#/games') return { view: 'games' };
  const gd = h.match(/^#\/games\/([\w-]+)$/);
  if (gd) return { view: 'gameDetail', gameId: gd[1] };
  const m = h.match(/^#\/game\/([\w-]+)$/);
  if (m) return { view: 'game', gameId: m[1] };
  if (h === '#/players') return { view: 'players' };
  if (h === '#/players/team') return { view: 'teamView' };
  const pm = h.match(/^#\/players\/([\w-]+)$/);
  if (pm) return { view: 'playerDetail', playerId: pm[1] };
  if (h === '#/takeaways') return { view: 'takeaways' };
  if (h === '#/strategies') return { view: 'strategies' };
  if (h === '#/opponents') return { view: 'opponents' };
  const oppM = h.match(/^#\/opponents\/([\w-]+)$/);
  if (oppM) return { view: 'opponent', teamId: oppM[1] };
  const pcm = h.match(/^#\/player-clips\/([\w-]+)/);
  if (pcm) {
    const preset = new URLSearchParams(h.includes('?') ? h.slice(h.indexOf('?')) : '').get('preset');
    return { view: 'playerClips', playerId: pcm[1], preset };
  }
  return { view: 'landing' };
}

export function navigate(hash) {
  if (typeof window === 'undefined') return;
  window.location.hash = hash.startsWith('#') ? hash : ('#' + hash);
}
