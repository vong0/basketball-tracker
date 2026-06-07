/**

 * Parse a segment label like "UG(O) matt: drives and kicks | vong: cuts to rim"
 * into structured action data.
 *
 * Format: TEAM[QUALITY](TYPE) player1,player2: note | more...
 *   TEAM:    U (us) | O (opponent)
 *   QUALITY: G (good) | B (bad) | omit (neutral)
 *   TYPE:    O | D | MAN | 2-3 | 3-2
 */
export function parseLabel(label) {
  if (!label || typeof label !== 'string') {
    return { actions: [], title: label || '', quality: 'neutral', team: 'us', type: 'O' };
  }

  const segments = label.split('|').map(s => s.trim()).filter(Boolean);
  let lastCode = null;
  const actions = [];

  for (const seg of segments) {
    const m = seg.match(/^(?:([UO])([GB]?)\(([A-Z0-9-]+)\)\s*)?(.*)$/);
    if (!m) continue;

    const [, teamCode, qualCode, typeCode, rest] = m;
    let code = (teamCode && typeCode) ? { team: teamCode, qual: qualCode, type: typeCode } : lastCode;
    if (teamCode && typeCode) lastCode = code;
    if (!code) code = { team: 'U', qual: '', type: 'O' };

    let players = [];
    let note = rest.trim();
    const colonIdx = rest.indexOf(':');
    if (colonIdx >= 0) {
      const playersStr = rest.slice(0, colonIdx).trim();
      note = rest.slice(colonIdx + 1).trim();
      if (playersStr) {
        players = playersStr.split(',').map(p => p.trim()).filter(Boolean);
      }
    }

    actions.push({
      team: code.team === 'O' ? 'opponent' : 'us',
      quality: code.qual === 'G' ? 'good' : code.qual === 'B' ? 'bad' : 'neutral',
      type: code.type,
      players,
      note
    });
  }

  const first = actions[0] || { players: [], note: '', quality: 'neutral', team: 'us', type: 'O' };
  let title;
  if (first.players.length > 0 && first.note) {
    title = first.players.join(', ') + ': ' + first.note;
  } else if (first.players.length > 0) {
    title = first.players.join(', ');
  } else if (first.note) {
    title = first.note;
  } else {
    title = label;
  }

  return {
    actions,
    title,
    quality: first.quality,
    team: first.team,
    type: first.type
  };
}
