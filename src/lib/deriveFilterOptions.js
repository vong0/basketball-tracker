/**

 * Scan parsed segments and return the available filter options.
 *
 *   players      — sorted list of unique us-team player names that appear
 *                  in any action. Excludes opponent-named players (those
 *                  collapse into the single "Opponents" bucket).
 *   hasOpponents — true if any action has team === \'O\'.
 *   ratings      — subset of [\'G\', \'B\'] that actually occur.
 *   possessions  — subset of [\'offense\', \'defense\'] that actually occur.
 *                  offense  = any action with type === \'O\'
 *                  defense  = any action with type === \'D\'
 *                  (MAN/2-3/3-2 are ignored for the filter UI per spec.)
 */
export function deriveFilterOptions(parsedSegments) {
  const players = new Set();
  let hasOpp = false;
  let hasGood = false, hasBad = false;
  let hasOffense = false, hasDefense = false;

  for (const parsed of parsedSegments) {
    if (!parsed || !parsed.actions) continue;
    for (const a of parsed.actions) {
      if (a.team === 'O') {
        hasOpp = true;
        // Don\'t add opponent-named players to the player list.
      } else if (a.team === 'U') {
        for (const p of a.players) {
          // 'all' is a literal team-wide marker, not a real player name.
          // Exclude from the filter list — it's already covered by "Any".
          if (p && p !== 'all') players.add(p);
        }
      }
      if (a.quality === 'G') hasGood = true;
      if (a.quality === 'B') hasBad = true;
      if (a.type === 'O') hasOffense = true;
      if (a.type === 'D') hasDefense = true;
    }
  }

  const ratings = [];
  if (hasGood) ratings.push('G');
  if (hasBad) ratings.push('B');

  const possessions = [];
  if (hasOffense) possessions.push('offense');
  if (hasDefense) possessions.push('defense');

  return {
    players: [...players].sort((a, b) => a.localeCompare(b)),
    hasOpponents: hasOpp,
    ratings,
    possessions,
  };
}

/**

 * Translate the UI-level filter choice into the shape that
 * `segmentMatchesFilter` expects. Returns null if no filter is active.
 */
export function buildFilter(choice) {
  if (!choice) return null;
  const f = {};
  if (choice.player === 'opponents') {
    f.team = 'O';
  } else if (choice.player) {
    f.players = [choice.player];
  }
  if (choice.rating) {
    f.quality = choice.rating;
  }
  if (choice.possession === 'offense') {
    f.type = 'O';
  } else if (choice.possession === 'defense') {
    f.type = 'D';
  }
  return Object.keys(f).length ? f : null;
}

export const EMPTY_CHOICE = { player: null, rating: null, possession: null };

export function isFilterActive(choice) {
  return !!(choice && (choice.player || choice.rating || choice.possession));
}
