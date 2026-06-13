/**
 * parseLabel.js — single source of truth for the segment label format.
 *
 * ============================================================================
 * LABEL FORMAT
 * ============================================================================
 *
 * Grammar:
 *   TEAM[QUALITY](TYPE) [players]: note [| more...] [>> summary]
 *
 * One label may contain multiple ACTIONS separated by `|`. Each action has:
 *
 *   TEAM     — required on the FIRST action.
 *              `U` = us, `O` = opponent.
 *              Subsequent actions inherit TEAM(TYPE) from the previous action
 *              if the prefix is omitted.
 *
 *   QUALITY  — optional. `G` = good, `B` = bad, omitted = neutral.
 *              From the actor's perspective: a good play *for the team
 *              doing it*. Display layer can re-interpret (e.g. opponent
 *              actions render as a blue dot regardless of G/B).
 *
 *   TYPE     — required on the first action. Frozen set:
 *                O   = offense
 *                D   = defense
 *                MAN = man-to-man defensive scheme
 *                2-3 = 2-3 zone defensive scheme
 *                3-2 = 3-2 zone defensive scheme
 *
 *   players  — optional, comma-separated short names. Examples:
 *                matt
 *                matt,vong
 *                all          (literal — used for team-wide actions)
 *
 *   note     — optional free text after `:`. Becomes searchable.
 *              May contain `#tag` words; these are extracted into a
 *              separate `tags` array on the parsed action.
 *
 *   |        — action separator. Subsequent actions inherit TEAM(TYPE)
 *              if their prefix is omitted.
 *
 *   >>       — summary delimiter. Trailing `>> text` is a one-line
 *              description of the whole segment, useful for multi-action
 *              segments where no single action captures the play.
 *              First `>>` wins; later `>>` are part of the summary text.
 *
 * Examples:
 *   UG(O) matt: drives baseline and kicks for open three
 *   UB(D) lost rotation, easy layup
 *   OG(O) opponent: well-executed pick and roll for open dunk
 *   U(MAN) all: full rotation snuffs out drive and kick
 *   UG(O) matt: drives | vong: screens | george: pops for three
 *   UG(O) matt: drives | george,kap: double screen >> textbook flow offense
 *   UG(O) matt: high screen and roll, great read #pnr
 *
 * ============================================================================
 * SEGMENT vs MARKER
 * ============================================================================
 *
 * Both use the same label format. They are distinguished by the presence
 * of `end` in the segment object:
 *
 *   Segment (clip):  { start: 95.04, end: 106.97, name: 'UG(O) matt: drives' }
 *   Marker (point):  { start: 52.90,              name: 'U(MAN)' }
 *
 * Markers represent a moment-in-time tag (e.g. defensive scheme change)
 * and are typically rendered as vertical ticks on a timeline.
 *
 * ============================================================================
 * PARSED OUTPUT SHAPE
 * ============================================================================
 *
 * parseLabel(label) returns:
 *
 *   {
 *     actions: [
 *       {
 *         team:    'U' | 'O',                     // code, not expanded
 *         quality: 'G' | 'B' | '',                // code; '' = neutral
 *         type:    'O' | 'D' | 'MAN' | '2-3' | '3-2',
 *         players: string[],                      // [] if none
 *         note:    string,                        // '' if none
 *         tags:    string[],                      // extracted #tag words
 *       },
 *       ...
 *     ],
 *     summary: string,                            // '' if no >> in label
 *     title:   string,                            // auto-generated row title
 *
 *     // Convenience aliases for the FIRST action — kept for backward
 *     // compatibility with components that haven't migrated to actions[]:
 *     team:    'us' | 'opponent',
 *     quality: 'good' | 'bad' | 'neutral',
 *     type:    string,
 *   }
 *
 * Codes (not expanded keys) are the canonical form. Display layer should
 * use the TEAMS/QUALITIES/TYPES lookups below to render labels.
 *
 * ============================================================================
 */


// ============================================================================
// LOOKUPS — single source of truth for code <-> display mappings.
// ============================================================================

export const TEAMS = {
  U: { code: 'U', key: 'us',       label: 'Us'   },
  O: { code: 'O', key: 'opponent', label: 'Opponent' },
};

export const QUALITIES = {
  G:  { code: 'G',  key: 'good',    label: 'Good',    color: 'green' },
  B:  { code: 'B',  key: 'bad',     label: 'Bad',     color: 'red'   },
  '': { code: '',   key: 'neutral', label: 'Neutral', color: 'gray'  },
};

export const TYPES = {
  O:     { code: 'O',     key: 'offense', label: 'Offense',     short: 'OFF' },
  D:     { code: 'D',     key: 'defense', label: 'Defense',     short: 'DEF' },
  MAN:   { code: 'MAN',   key: 'man',     label: 'Man defense', short: 'MAN' },
  '2-3': { code: '2-3',   key: 'zone23',  label: '2-3 zone',    short: '2-3' },
  '3-2': { code: '3-2',   key: 'zone32',  label: '3-2 zone',    short: '3-2' },
};

const VALID_TEAM_CODES = new Set(Object.keys(TEAMS));
const VALID_TYPE_CODES = new Set(Object.keys(TYPES));


// ============================================================================
// DISPLAY HELPERS — code -> human-readable string.
// ============================================================================

export function teamLabel(code) {
  return TEAMS[code]?.label ?? code;
}

export function qualityLabel(code) {
  return QUALITIES[code]?.label ?? 'Neutral';
}

export function typeLabel(code) {
  return TYPES[code]?.label ?? code;
}

/**
 * Quality color for an action, accounting for opponent rendering rule.
 * Opponent actions always render blue regardless of G/B; G/B is preserved
 * internally for filtering.
 */
export function qualityColor(action) {
  if (action.team === 'O') return 'gray';
  return QUALITIES[action.quality]?.color ?? 'gray';
}


// ============================================================================
// PARSER
// ============================================================================

const PREFIX_RE = /^(?:([UO])([GB]?)\(([A-Z0-9-]+)\)\s*)?(.*)$/;

/**
 * Extract `#tag` words out of free-text. Returns { note, tags } where
 * `note` has the tags removed and `tags` is the array of tag words.
 */
function extractTags(rawNote) {
  if (!rawNote) return { note: '', tags: [] };
  const tags = [];
  const tagged = rawNote.replace(/#([\w-]+(?:,[\w-]+)*)/g, (_m, group) => {
    for (const t of group.split(',')) {
      const cleaned = t.trim();
      if (cleaned) tags.push(cleaned);
    }
    return '';
  });
  return { note: tagged.replace(/\s+/g, ' ').trim(), tags };
}

/**
 * Parse one segment label into structured data. Always returns a valid
 * shape, even for empty/null input.
 */
export function parseLabel(label) {
  const empty = {
    actions: [],
    summary: '',
    title: label || '',
    team: 'us',
    quality: 'neutral',
    type: 'O',
  };

  if (!label || typeof label !== 'string') return empty;

  // Split summary off first (only the FIRST `>>` is the delimiter).
  let actionsPart = label;
  let summary = '';
  const sumIdx = label.indexOf('>>');
  if (sumIdx >= 0) {
    actionsPart = label.slice(0, sumIdx);
    summary = label.slice(sumIdx + 2).trim();
  }

  const segments = actionsPart.split('|').map(s => s.trim()).filter(Boolean);
  if (segments.length === 0) return { ...empty, summary };

  let lastCode = null;
  const actions = [];

  for (const seg of segments) {
    const m = seg.match(PREFIX_RE);
    if (!m) continue;

    const [, teamCode, qualCode, typeCode, rest] = m;

    let code;
    if (teamCode && typeCode) {
      code = { team: teamCode, qual: qualCode || '', type: typeCode };
      lastCode = code;
    } else if (lastCode) {
      code = lastCode;
    } else {
      code = { team: 'U', qual: '', type: 'O' };
    }

    let players = [];
    let rawNote = rest.trim();
    const colonIdx = rest.indexOf(':');
    if (colonIdx >= 0) {
      const playersStr = rest.slice(0, colonIdx).trim();
      rawNote = rest.slice(colonIdx + 1).trim();
      if (playersStr) {
        players = playersStr.split(',').map(p => p.trim()).filter(Boolean);
      }
    }

    const { note, tags } = extractTags(rawNote);

    actions.push({
      team: code.team,
      quality: code.qual,
      type: code.type,
      players,
      note,
      tags,
    });
  }

  // Auto-generate a title from the first action.
  const first = actions[0];
  let title;
  if (summary) {
    title = summary;
  } else if (first) {
    if (first.players.length > 0 && first.note) {
      title = first.players.join(', ') + ': ' + first.note;
    } else if (first.players.length > 0) {
      title = first.players.join(', ');
    } else if (first.note) {
      title = first.note;
    } else {
      title = label;
    }
  } else {
    title = label;
  }

  // Backward-compat aliases for the first action (expanded keys).
  const firstAlias = first || { team: 'U', quality: '', type: 'O' };
  const teamAlias = firstAlias.team === 'O' ? 'opponent' : 'us';
  const qualityAlias = firstAlias.quality === 'G'
    ? 'good'
    : firstAlias.quality === 'B'
    ? 'bad'
    : 'neutral';

  return {
    actions,
    summary,
    title,
    team: teamAlias,
    quality: qualityAlias,
    type: firstAlias.type,
  };
}


// ============================================================================
// FILTERS
// ============================================================================

function asArray(v) {
  if (v === undefined || v === null) return null;
  return Array.isArray(v) ? v : [v];
}

export function actionMatchesFilter(action, filter) {
  if (!filter) return true;

  const teams = asArray(filter.team);
  if (teams && !teams.includes(action.team)) return false;

  const qualities = asArray(filter.quality);
  if (qualities && !qualities.includes(action.quality)) return false;

  const types = asArray(filter.type);
  if (types && !types.includes(action.type)) return false;

  const players = asArray(filter.players);
  if (players && players.length > 0) {
    const has = action.players.some(p => players.includes(p));
    if (!has) return false;
  }

  return true;
}

export function segmentMatchesFilter(parsed, filter) {
  if (!filter) return true;

  const hasStructured =
    filter.team !== undefined ||
    filter.quality !== undefined ||
    filter.type !== undefined ||
    (filter.players !== undefined && asArray(filter.players)?.length);

  if (hasStructured) {
    const anyMatch = parsed.actions.some(a => actionMatchesFilter(a, filter));
    if (!anyMatch) return false;
  }

  if (filter.text && typeof filter.text === 'string') {
    const q = filter.text.toLowerCase().trim();
    if (q) {
      const haystacks = [];
      for (const a of parsed.actions) {
        if (a.note) haystacks.push(a.note);
        if (a.players.length) haystacks.push(a.players.join(' '));
        if (a.tags.length) haystacks.push(a.tags.join(' '));
      }
      if (parsed.summary) haystacks.push(parsed.summary);
      const found = haystacks.some(s => s.toLowerCase().includes(q));
      if (!found) return false;
    }
  }

  return true;
}


// ============================================================================
// VALIDATION
// ============================================================================

export function validateParsed(parsed, raw) {
  const issues = [];
  if (!parsed.actions.length) {
    issues.push('no actions parsed');
    return issues;
  }
  for (let i = 0; i < parsed.actions.length; i++) {
    const a = parsed.actions[i];
    if (!VALID_TEAM_CODES.has(a.team)) {
      issues.push(`action ${i + 1}: unknown team code "${a.team}"`);
    }
    if (!VALID_TYPE_CODES.has(a.type)) {
      issues.push(`action ${i + 1}: unknown type code "${a.type}"`);
    }
    if (a.quality && !['G', 'B'].includes(a.quality)) {
      issues.push(`action ${i + 1}: unknown quality code "${a.quality}"`);
    }
  }
  if (typeof raw === 'string' && /^T[GB]?\(/.test(raw)) {
    issues.push('legacy `T` team prefix detected (should be `O`)');
  }
  return issues;
}


// ============================================================================
// CLI
// ============================================================================
//
//   node parseLabel.js                      # parse built-in samples
//   node parseLabel.js path/to/game.json    # parse all segments in a file
//   node parseLabel.js -s "UG(O) matt: drive"   # parse a single string
//   echo "UG(O) ..." | node parseLabel.js   # piped input
// ============================================================================

async function runCli() {
  const { fileURLToPath } = await import('url');
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return;

  const args = process.argv.slice(2);

  // -s "string" : parse a single label string
  if (args[0] === '-s') {
    const input = args.slice(1).join(' ');
    if (!input) {
      console.error('Usage: node parseLabel.js -s "<label>"');
      process.exit(2);
    }
    console.log('INPUT:', input);
    const parsed = parseLabel(input);
    console.log(JSON.stringify(parsed, null, 2));
    const issues = validateParsed(parsed, input);
    if (issues.length) {
      console.log('ISSUES:');
      for (const it of issues) console.log('  -', it);
    }
    return;
  }

  // Positional file argument: parse all segments
  if (args.length > 0 && !args[0].startsWith('-')) {
    const file = args[0];
    const fs = await import('fs');
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) {
      console.error(`Cannot read ${file}: ${e.message}`);
      process.exit(2);
    }
    let game;
    try {
      game = JSON.parse(text);
    } catch {
      try {
        const json5 = await import('json5');
        game = (json5.default || json5).parse(text);
      } catch (e) {
        console.error(`Cannot parse ${file}: ${e.message}`);
        process.exit(2);
      }
    }
    const segments = game.cutSegments || [];
    let totalIssues = 0;
    console.log(`Parsing ${segments.length} segments from ${file}\n`);
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const parsed = parseLabel(s.name || '');
      const issues = validateParsed(parsed, s.name);
      if (issues.length) {
        totalIssues += issues.length;
        console.log(`[${i}] @ ${s.start}: ${s.name}`);
        for (const it of issues) console.log(`    - ${it}`);
      }
    }
    console.log(`\nTotal issues: ${totalIssues}`);
    process.exit(totalIssues > 0 ? 1 : 0);
  }

  // Piped input (one label per line)
  if (!process.stdin.isTTY) {
    let buf = '';
    for await (const chunk of process.stdin) buf += chunk;
    const lines = buf.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length) {
      for (const line of lines) {
        console.log('---');
        console.log('INPUT:', line);
        console.log(JSON.stringify(parseLabel(line), null, 2));
      }
      return;
    }
  }

  // Default: built-in samples
  const samples = [
    'UG(O) matt: drives baseline and kicks for open three',
    'UB(O) matt: bad pass | UG(D) george: deflects, recovers | UG(O) vong: fastbreak layup >> turnover into transition score',
    'OG(O) opponent: well-executed pick and roll for open dunk',
    'U(MAN) all: full rotation snuffs out drive and kick',
    'UG(O) matt: high screen and roll, great read #pnr',
    'UG(O) matt: drives | vong: screens | george: pops for three',
    'O(2-3) opponent runs 2-3 zone, we get stuck on perimeter',
  ];
  for (const s of samples) {
    console.log('---');
    console.log('INPUT:', s);
    console.log(JSON.stringify(parseLabel(s), null, 2));
  }
}

if (typeof process !== 'undefined' && process.argv) {
  runCli().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
