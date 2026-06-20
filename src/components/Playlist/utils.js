export function dotClassFor(action, styles) {
  if (!action) return styles.dotNeutral;
  if (action.team === 'O') return styles.dotOpponent;
  if (action.quality === 'G') return styles.dotGood;
  if (action.quality === 'B') return styles.dotBad;
  return styles.dotNeutral;
}

export function isSchemeOnlyNoQuality(action) {
  if (!action) return false;
  const isScheme = action.type === 'MAN' || action.type === '2-3' || action.type === '3-2';
  return isScheme && !action.quality;
}
