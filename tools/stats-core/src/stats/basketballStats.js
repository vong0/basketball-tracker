import { SHOT_ZONES, CONTEST_LEVELS, OPEN_CONTESTS, LIGHT_CONTESTS, BAD_CONTESTS } from './basketballConstants.js';

const ALL = 'ALL';

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function yes(value) {
  return String(value ?? '').trim().toLowerCase() === 'yes';
}

export function made(row) {
  return String(row?.result ?? '').trim().toLowerCase() === 'make';
}

export function nonEmpty(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function rowCount(row) {
  return toNumber(row?.count, 1);
}

export function safeDiv(num, den, blank = null) {
  const n = toNumber(num);
  const d = toNumber(den);
  return d ? n / d : blank;
}

export function round(value, places = 3) {
  if (value === null || value === undefined || value === '') return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export function playerKey(row) {
  return row?.player_id ?? row?.player ?? row?.name ?? '';
}

export function scopeRows(rows = [], filters = {}) {
  const { gameId = ALL, half = ALL, player = ALL } = filters;
  return rows.filter(row => {
    const gameOk = gameId === ALL || gameId === 'all' || row.game_id === gameId;
    const halfOk = half === ALL || half === 'all' || row.half === half;
    const playerOk = player === ALL || player === 'all' || playerKey(row) === player;
    return gameOk && halfOk && playerOk;
  });
}

export function getPlayers(data = {}) {
  const fromRoster = (data.players || data.roster || []).map(p => ({
    id: p.player_id ?? p.id ?? p.name ?? p.player,
    name: p.name ?? p.player ?? p.player_id ?? p.id,
    jersey: p.jersey ?? '',
    position: p.position ?? '',
    active: p.active !== false,
    photo_url: p.photo_url ?? p.photoUrl ?? '',
    notes: p.notes ?? ''
  })).filter(p => nonEmpty(p.id));

  if (fromRoster.length) return fromRoster;

  const names = new Set();
  for (const s of data.shots || []) if (nonEmpty(s.player)) names.add(s.player);
  for (const e of data.events || []) if (nonEmpty(e.player)) names.add(e.player);
  for (const ft of data.freeThrows || data.free_throws || []) if (nonEmpty(ft.player)) names.add(ft.player);
  return [...names].sort().map(name => ({ id: name, name, active: true }));
}

function sum(rows, fn) {
  return rows.reduce((acc, row) => acc + toNumber(fn(row)), 0);
}

function countEvents(events, type, subtype = null) {
  return sum(events, e => {
    if (type && e.event_type !== type) return 0;
    if (subtype && e.event_subtype !== subtype) return 0;
    return rowCount(e);
  });
}

function pointsCreated(events, type, subtype = null) {
  return sum(events, e => {
    if (type && e.event_type !== type) return 0;
    if (subtype && e.event_subtype !== subtype) return 0;
    return toNumber(e.points_created);
  });
}

function shotPoints(shots) {
  return sum(shots, s => made(s) ? toNumber(s.points) : 0);
}

function fieldGoalStats(shots) {
  const fga = shots.length;
  const madeShots = shots.filter(made);
  const fgm = madeShots.length;
  const twoPA = shots.filter(s => toNumber(s.points) === 2).length;
  const twoPM = madeShots.filter(s => toNumber(s.points) === 2).length;
  const threePA = shots.filter(s => toNumber(s.points) === 3).length;
  const threePM = madeShots.filter(s => toNumber(s.points) === 3).length;
  return {
    FGM: fgm,
    FGA: fga,
    FG_pct: safeDiv(fgm, fga),
    twoPM,
    twoPA,
    twoP_pct: safeDiv(twoPM, twoPA),
    threePM,
    threePA,
    threeP_pct: safeDiv(threePM, threePA),
    shot_points: shotPoints(shots),
    eFG_pct: safeDiv(fgm + 0.5 * threePM, fga)
  };
}

function freeThrowStats(freeThrows) {
  const fta = freeThrows.length;
  const ftm = freeThrows.filter(made).length;
  return { FTM: ftm, FTA: fta, FT_pct: safeDiv(ftm, fta), ft_points: ftm };
}

export function shotBreakdown(shots, key, buckets) {
  const totalFGA = shots.length;
  return buckets.map(bucket => {
    const rows = shots.filter(s => String(s[key] ?? '') === bucket);
    const fga = rows.length;
    const fgm = rows.filter(made).length;
    const pts = shotPoints(rows);
    return {
      label: bucket,
      FGM: fgm,
      FGA: fga,
      FG_pct: safeDiv(fgm, fga),
      rate: safeDiv(fga, totalFGA),
      PTS: pts,
      PPS: safeDiv(pts, fga)
    };
  });
}

export function calculateLineupStats(data = {}, filters = {}) {
  const stints = scopeRows(data.lineupStints || data.lineup_stints || [], filters);
  const byLineup = new Map();
  for (const row of stints) {
    const players = [row.player_1, row.player_2, row.player_3, row.player_4, row.player_5].filter(nonEmpty);
    const label = row.lineup_label || players.join(' / ') || 'Unknown lineup';
    if (!byLineup.has(label)) {
      byLineup.set(label, {
        lineup_label: label,
        players,
        stints: 0,
        off_poss: 0,
        def_poss: 0,
        points_for: 0,
        points_against: 0,
        net_points: 0,
        off_rating: null,
        def_rating: null,
        net_rating: null
      });
    }
    const entry = byLineup.get(label);
    entry.stints += 1;
    entry.off_poss += toNumber(row.off_poss);
    entry.def_poss += toNumber(row.def_poss);
    entry.points_for += toNumber(row.points_for);
    entry.points_against += toNumber(row.points_against);
  }
  for (const entry of byLineup.values()) {
    entry.net_points = entry.points_for - entry.points_against;
    entry.off_rating = safeDiv(entry.points_for * 100, entry.off_poss);
    entry.def_rating = safeDiv(entry.points_against * 100, entry.def_poss);
    entry.net_rating = entry.off_rating !== null && entry.def_rating !== null ? entry.off_rating - entry.def_rating : null;
  }
  return [...byLineup.values()].sort((a, b) => b.net_points - a.net_points);
}

function playerOnCourt(data, player, filters = {}) {
  const stints = scopeRows(data.lineupStints || data.lineup_stints || [], filters).filter(row => {
    const players = [row.player_1, row.player_2, row.player_3, row.player_4, row.player_5];
    return players.includes(player);
  });
  const pointsFor = sum(stints, r => r.points_for);
  const pointsAgainst = sum(stints, r => r.points_against);
  const offPoss = sum(stints, r => r.off_poss);
  const defPoss = sum(stints, r => r.def_poss);
  const offRtg = safeDiv(pointsFor * 100, offPoss);
  const defRtg = safeDiv(pointsAgainst * 100, defPoss);
  return {
    OnCourt_Stints: stints.length,
    OnCourt_PF: pointsFor,
    OnCourt_PA: pointsAgainst,
    Player_plus_minus: pointsFor - pointsAgainst,
    OnCourt_Off_Poss: offPoss,
    OnCourt_Def_Poss: defPoss,
    OnCourt_Off_Rtg: offRtg,
    OnCourt_Def_Rtg: defRtg,
    OnCourt_Net_Rtg: offRtg !== null && defRtg !== null ? offRtg - defRtg : null
  };
}

export function calculatePlayerStats(data = {}, options = {}) {
  const { player, gameId = ALL, half = ALL } = options;
  if (!player) throw new Error('calculatePlayerStats requires { player }');

  const shotScope = scopeRows(data.shots || [], { gameId, half }).filter(s => playerKey(s) === player);
  const eventScope = scopeRows(data.events || [], { gameId, half }).filter(e => playerKey(e) === player);
  const ftScope = scopeRows(data.freeThrows || data.free_throws || [], { gameId, half }).filter(ft => playerKey(ft) === player);
  const allShots = scopeRows(data.shots || [], { gameId, half });

  const fg = fieldGoalStats(shotScope);
  const ft = freeThrowStats(ftScope);
  const PTS = fg.shot_points + ft.ft_points;

  const madePlayerShots = shotScope.filter(made);
  const assistedFGM = madePlayerShots.filter(s => nonEmpty(s.assisted_by)).length;
  const unassistedFGM = fg.FGM - assistedFGM;

  const assistedShotsByPlayer = allShots.filter(s => made(s) && s.assisted_by === player);
  const AST = assistedShotsByPlayer.length;
  const AST_PTS = shotPoints(assistedShotsByPlayer);

  const potentialAST = countEvents(eventScope, 'creation', 'potential_assist');
  const advCreated = sum(eventScope, e => e.event_subtype === 'advantage_created' ? rowCount(e) : 0);
  const advCreatedPts = sum(eventScope, e => e.event_subtype === 'advantage_created' ? toNumber(e.points_created) : 0);
  const creationAdv = countEvents(eventScope, 'creation', 'advantage_created');
  const creationAdvPts = pointsCreated(eventScope, 'creation', 'advantage_created');

  const screenAST = countEvents(eventScope, 'screen', 'screen_assist');
  const screenASTPts = pointsCreated(eventScope, 'screen', 'screen_assist');
  const screenCreatedOpp = countEvents(eventScope, 'screen', 'screen_opportunity');
  const screenOppPts = pointsCreated(eventScope, 'screen', 'screen_opportunity');
  const screenAdv = countEvents(eventScope, 'screen', 'advantage_created');
  const screenAdvPts = pointsCreated(eventScope, 'screen', 'advantage_created');
  const screenCreatedTotal = screenAST + screenCreatedOpp + screenAdv;
  const screenCreatedPts = screenASTPts + screenOppPts + screenAdvPts;

  const OREB = countEvents(eventScope, 'rebound', 'offensive');
  const DREB = countEvents(eventScope, 'rebound', 'defensive');
  const STL = countEvents(eventScope, 'steal');
  const BLK = countEvents(eventScope, 'block');
  const DEFLECTION = countEvents(eventScope, 'deflection');
  const TOV = countEvents(eventScope, 'turnover');
  const Fouls = countEvents(eventScope, 'foul');
  const Charges_Drawn = countEvents(eventScope, 'charge_drawn');

  const openShots = shotScope.filter(s => OPEN_CONTESTS.has(String(s.contest ?? '')));
  const lightContestShots = shotScope.filter(s => LIGHT_CONTESTS.has(String(s.contest ?? '')));
  const badShots = shotScope.filter(s => BAD_CONTESTS.has(String(s.contest ?? '')));
  const transitionShots = shotScope.filter(s => yes(s.transition));

  const openFGA = openShots.length;
  const openFGM = openShots.filter(made).length;
  const openPTS = shotPoints(openShots);
  const lightContestFGA = lightContestShots.length;
  const lightContestFGM = lightContestShots.filter(made).length;
  const lightContestPTS = shotPoints(lightContestShots);
  const badShotFGA = badShots.length;
  const badShotFGM = badShots.filter(made).length;
  const badShotPTS = shotPoints(badShots);
  const transitionFGA = transitionShots.length;
  const transitionFGM = transitionShots.filter(made).length;
  const transitionPTS = shotPoints(transitionShots);

  const paintTouchesCreated = shotScope.filter(s => yes(s.paint_touch)).length + countEvents(eventScope, 'creation', 'paint_touch_created');
  const driveKick3PACreated = allShots.filter(s => s.assisted_by === player && yes(s.drive_kick) && toNumber(s.points) === 3).length + countEvents(eventScope, 'creation', 'drive_kick_created');

  const Poss_Used = fg.FGA + 0.44 * ft.FTA + TOV;
  const onCourt = playerOnCourt(data, player, { gameId, half });

  return {
    player,
    filter: { gameId, half },
    PTS,
    ...fg,
    ...ft,
    TS_pct: safeDiv(PTS, 2 * (fg.FGA + 0.44 * ft.FTA)),
    AST,
    AST_PTS,
    AST_Rate: safeDiv(AST, fg.FGM),
    Potential_AST: potentialAST,
    Adv_Created: advCreated,
    Adv_Created_PTS: advCreatedPts,
    Creation_Adv: creationAdv,
    Creation_Adv_PTS: creationAdvPts,
    Screen_AST: screenAST,
    Screen_AST_PTS: screenASTPts,
    Screen_Created_Opp: screenCreatedOpp,
    Screen_Adv: screenAdv,
    Screen_Adv_PTS: screenAdvPts,
    Screen_Created_Total: screenCreatedTotal,
    Screen_Created_PTS: screenCreatedPts,
    PTS_per_Screen_Created: safeDiv(screenCreatedPts, screenCreatedTotal),
    OREB,
    DREB,
    REB: OREB + DREB,
    STL,
    BLK,
    DEFLECTION,
    Defensive_Playmaking: STL + BLK + DEFLECTION,
    TOV,
    AST_TO: safeDiv(AST, TOV),
    Fouls,
    Charges_Drawn,
    Poss_Used,
    PTS_per_Poss: safeDiv(PTS, Poss_Used),
    Assisted_FGM: assistedFGM,
    Unassisted_FGM: unassistedFGM,
    Assisted_FG_Rate: safeDiv(assistedFGM, fg.FGM),
    Open_FGA: openFGA,
    Open_FGM: openFGM,
    Open_PTS: openPTS,
    Open_FGA_Rate: safeDiv(openFGA, fg.FGA),
    Open_PPS: safeDiv(openPTS, openFGA),
    Light_Contest_FGA: lightContestFGA,
    Light_Contest_FGM: lightContestFGM,
    Light_Contest_PTS: lightContestPTS,
    Light_Contest_Rate: safeDiv(lightContestFGA, fg.FGA),
    Light_Contest_PPS: safeDiv(lightContestPTS, lightContestFGA),
    Bad_Shot_FGA: badShotFGA,
    Bad_Shot_FGM: badShotFGM,
    Bad_Shot_PTS: badShotPTS,
    Bad_Shot_Rate: safeDiv(badShotFGA, fg.FGA),
    Bad_Shot_PPS: safeDiv(badShotPTS, badShotFGA),
    Transition_FGA: transitionFGA,
    Transition_FGM: transitionFGM,
    Transition_PTS: transitionPTS,
    Transition_PPS: safeDiv(transitionPTS, transitionFGA),
    Paint_Touches_Created: paintTouchesCreated,
    Drive_Kick_3PA_Created: driveKick3PACreated,
    zoneBreakdown: shotBreakdown(shotScope, 'shot_zone', SHOT_ZONES),
    contestBreakdown: shotBreakdown(shotScope, 'contest', CONTEST_LEVELS),
    ...onCourt
  };
}

export function calculateAllPlayerStats(data = {}, filters = {}) {
  const teamPossUsed = calculateTeamStats(data, filters).Poss_Used;
  return getPlayers(data).map(p => {
    const stats = calculatePlayerStats(data, { ...filters, player: p.id });
    return { ...stats, Usage_pct: safeDiv(stats.Poss_Used, teamPossUsed) };
  });
}

export function calculateTeamStats(data = {}, options = {}) {
  const { gameId = ALL, half = ALL } = options;
  const shots = scopeRows(data.shots || [], { gameId, half });
  const events = scopeRows(data.events || [], { gameId, half });
  const freeThrows = scopeRows(data.freeThrows || data.free_throws || [], { gameId, half });
  const lineups = scopeRows(data.lineupStints || data.lineup_stints || [], { gameId, half });

  const fg = fieldGoalStats(shots);
  const ft = freeThrowStats(freeThrows);
  const PTS = fg.shot_points + ft.ft_points;

  const AST = shots.filter(s => made(s) && nonEmpty(s.assisted_by)).length;
  const AST_PTS = shotPoints(shots.filter(s => made(s) && nonEmpty(s.assisted_by)));

  const potentialAST = countEvents(events, 'creation', 'potential_assist');
  const advCreated = sum(events, e => e.event_subtype === 'advantage_created' ? rowCount(e) : 0);
  const advCreatedPts = sum(events, e => e.event_subtype === 'advantage_created' ? toNumber(e.points_created) : 0);

  const screenAST = countEvents(events, 'screen', 'screen_assist');
  const screenASTPts = pointsCreated(events, 'screen', 'screen_assist');
  const screenCreatedOpp = countEvents(events, 'screen', 'screen_opportunity');
  const screenOppPts = pointsCreated(events, 'screen', 'screen_opportunity');
  const screenAdv = countEvents(events, 'screen', 'advantage_created');
  const screenAdvPts = pointsCreated(events, 'screen', 'advantage_created');
  const screenCreatedTotal = screenAST + screenCreatedOpp + screenAdv;
  const screenCreatedPts = screenASTPts + screenOppPts + screenAdvPts;

  const OREB = countEvents(events, 'rebound', 'offensive');
  const DREB = countEvents(events, 'rebound', 'defensive');
  const STL = countEvents(events, 'steal');
  const BLK = countEvents(events, 'block');
  const DEFLECTION = countEvents(events, 'deflection');
  const TOV = countEvents(events, 'turnover');
  const Fouls = countEvents(events, 'foul');
  const Charges_Drawn = countEvents(events, 'charge_drawn');

  const openShots = shots.filter(s => OPEN_CONTESTS.has(String(s.contest ?? '')));
  const lightContestShots = shots.filter(s => LIGHT_CONTESTS.has(String(s.contest ?? '')));
  const badShots = shots.filter(s => BAD_CONTESTS.has(String(s.contest ?? '')));
  const transitionShots = shots.filter(s => yes(s.transition));

  const linePF = sum(lineups, r => r.points_for);
  const linePA = sum(lineups, r => r.points_against);
  const offPoss = sum(lineups, r => r.off_poss);
  const defPoss = sum(lineups, r => r.def_poss);
  const offRtg = safeDiv(linePF * 100, offPoss);
  const defRtg = safeDiv(linePA * 100, defPoss);
  const Poss_Used = fg.FGA + 0.44 * ft.FTA + TOV;

  return {
    filter: { gameId, half },
    PTS,
    ...fg,
    ...ft,
    TS_pct: safeDiv(PTS, 2 * (fg.FGA + 0.44 * ft.FTA)),
    AST,
    AST_PTS,
    AST_Rate: safeDiv(AST, fg.FGM),
    Potential_AST: potentialAST,
    Adv_Created: advCreated,
    Adv_Created_PTS: advCreatedPts,
    Paint_Touches_Created: shots.filter(s => yes(s.paint_touch)).length + countEvents(events, 'creation', 'paint_touch_created'),
    Drive_Kick_3PA_Created: shots.filter(s => yes(s.drive_kick) && toNumber(s.points) === 3).length + countEvents(events, 'creation', 'drive_kick_created'),
    Charges_Drawn,
    Fouls,
    Screen_AST: screenAST,
    Screen_AST_PTS: screenASTPts,
    Screen_Created_Opp: screenCreatedOpp,
    Screen_Adv: screenAdv,
    Screen_Adv_PTS: screenAdvPts,
    Screen_Created_Total: screenCreatedTotal,
    Screen_Created_PTS: screenCreatedPts,
    PTS_per_Screen_Created: safeDiv(screenCreatedPts, screenCreatedTotal),
    OREB,
    DREB,
    REB: OREB + DREB,
    STL,
    BLK,
    DEFLECTION,
    Defensive_Playmaking: STL + BLK + DEFLECTION,
    TOV,
    AST_TO: safeDiv(AST, TOV),
    Poss_Used,
    PTS_per_Poss: safeDiv(PTS, Poss_Used),
    Lineup_Off_Poss: offPoss,
    Lineup_Def_Poss: defPoss,
    Lineup_PF: linePF,
    Lineup_PA: linePA,
    Lineup_Net: linePF - linePA,
    Off_Rtg: offRtg,
    Def_Rtg: defRtg,
    Net_Rtg: offRtg !== null && defRtg !== null ? offRtg - defRtg : null,
    Open_FGA: openShots.length,
    Open_FGM: openShots.filter(made).length,
    Open_PTS: shotPoints(openShots),
    Open_FGA_Rate: safeDiv(openShots.length, fg.FGA),
    Open_PPS: safeDiv(shotPoints(openShots), openShots.length),
    Light_Contest_FGA: lightContestShots.length,
    Light_Contest_FGM: lightContestShots.filter(made).length,
    Light_Contest_PTS: shotPoints(lightContestShots),
    Light_Contest_Rate: safeDiv(lightContestShots.length, fg.FGA),
    Light_Contest_PPS: safeDiv(shotPoints(lightContestShots), lightContestShots.length),
    Bad_Shot_FGA: badShots.length,
    Bad_Shot_FGM: badShots.filter(made).length,
    Bad_Shot_PTS: shotPoints(badShots),
    Bad_Shot_Rate: safeDiv(badShots.length, fg.FGA),
    Bad_Shot_PPS: safeDiv(shotPoints(badShots), badShots.length),
    Transition_FGA: transitionShots.length,
    Transition_FGM: transitionShots.filter(made).length,
    Transition_PTS: shotPoints(transitionShots),
    Transition_PPS: safeDiv(shotPoints(transitionShots), transitionShots.length),
    zoneBreakdown: shotBreakdown(shots, 'shot_zone', SHOT_ZONES),
    contestBreakdown: shotBreakdown(shots, 'contest', CONTEST_LEVELS)
  };
}

export function calculateGameReport(data = {}, options = {}) {
  const { gameId } = options;
  if (!gameId || gameId === ALL || gameId === 'all') throw new Error('calculateGameReport requires a single gameId');
  const team = calculateTeamStats(data, { gameId });
  const players = calculateAllPlayerStats(data, { gameId })
    .filter(p => p.FGA || p.FTA || p.REB || p.AST || p.TOV || p.OnCourt_Stints)
    .sort((a, b) => b.PTS - a.PTS);
  const lineups = calculateLineupStats(data, { gameId });
  return {
    gameId,
    game: (data.games || []).find(g => g.game_id === gameId) || null,
    team,
    players,
    leaders: {
      points: [...players].sort((a, b) => b.PTS - a.PTS)[0] || null,
      assists: [...players].sort((a, b) => b.AST - a.AST)[0] || null,
      rebounds: [...players].sort((a, b) => b.REB - a.REB)[0] || null,
      screenCreated: [...players].sort((a, b) => b.Screen_Created_Total - a.Screen_Created_Total)[0] || null,
      defensivePlaymaking: [...players].sort((a, b) => b.Defensive_Playmaking - a.Defensive_Playmaking)[0] || null
    },
    lineups
  };
}

export function formatPct(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '—';
  return `${(toNumber(value) * 100).toFixed(digits)}%`;
}

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '—';
  const n = toNumber(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}
