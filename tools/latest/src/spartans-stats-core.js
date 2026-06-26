// Spartans Stats Core v0.5.6
// Headless stat/report engine for the Spartans tracker data.
// No DOM. No localStorage. Works in Vite/React, GitHub Pages ES modules, or Node.

export const ZONES = [
  'rim', 'paint',
  'left midrange', 'middle midrange', 'right midrange',
  'left corner 3', 'right corner 3', 'left wing 3', 'top 3', 'right wing 3',
  'other'
];

export const CONTESTS = ['wide open','open','light','heavy','blocked/smothered'];
export const SHOT_TYPES = ['catch-and-shoot','pull-up','layup','floater','runner','stepback','post','putback','cut','transition','other'];

const OPEN = new Set(['wide open','open']);
const LIGHT = new Set(['light']);
const BAD = new Set(['heavy','blocked/smothered']);

export function clone(value) { return JSON.parse(JSON.stringify(value ?? null)); }
export function num(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
export function made(row) { return String(row?.result || '').toLowerCase() === 'make'; }
export function yes(value) { return String(value || '').toLowerCase() === 'yes' || value === true; }
export function nonEmpty(value) { return value !== undefined && value !== null && String(value).trim() !== ''; }
export function safe(numerator, denominator) { numerator = Number(numerator); denominator = Number(denominator); return denominator ? numerator / denominator : null; }
export function round(value, digits = 2) { if (value === null || value === undefined || !Number.isFinite(Number(value))) return null; return Number(Number(value).toFixed(digits)); }
export function pctValue(value, digits = 1) { if (value === null || value === undefined || !Number.isFinite(Number(value))) return null; return Number((Number(value) * 100).toFixed(digits)); }
export function pctText(value, digits = 1) { const p = pctValue(value, digits); return p === null ? '—' : `${p}%`; }
export function ratioText(madeValue, attemptedValue, pct = null) { const p = pct ?? safe(madeValue, attemptedValue); return `${num(madeValue)}/${num(attemptedValue)} (${pctText(p)})`; }
export function dashNull(value) { return value === null || value === undefined || Number.isNaN(value) ? '—' : value; }

export function seasonFromGameId(gameId) {
  const match = String(gameId || '').match(/^(\d{4}-S\d+)\s+G(\d+)/i);
  return match ? { season_id: match[1], game_number: Number(match[2]) } : null;
}

export function normalizeFilters(filters = {}) {
  return {
    seasonId: filters.seasonId ?? filters.season_id ?? 'ALL',
    gameId: filters.gameId ?? filters.game_id ?? 'ALL',
    half: filters.half ?? 'ALL',
    player: filters.player ?? 'ALL'
  };
}

export function zoneFromXY(xPct, yPct) {
  const x = num(xPct) / 100 * 15;
  const y = num(yPct) / 100 * 14;
  const dx = x - 7.5;
  const dy = y - 1.575;
  const dist = Math.hypot(dx, dy);
  let zone = 'other';
  if (dist <= 1.35) zone = 'rim';
  else if (x >= 5.05 && x <= 9.95 && y <= 5.8) zone = 'paint';
  else if (dist < 6.75) {
    if (x < 5.2) zone = 'left midrange';
    else if (x > 9.8) zone = 'right midrange';
    else zone = 'middle midrange';
  } else {
    if (y < 3.05 && x < 2.2) zone = 'left corner 3';
    else if (y < 3.05 && x > 12.8) zone = 'right corner 3';
    else if (x < 5.2) zone = 'left wing 3';
    else if (x > 9.8) zone = 'right wing 3';
    else zone = 'top 3';
  }
  return { zone, dist: Math.round(dist * 10) / 10 };
}

export function normalizeShotZone(shot = {}) {
  if (shot.shot_x !== undefined && shot.shot_y !== undefined && shot.shot_x !== '' && shot.shot_y !== '') {
    return zoneFromXY(shot.shot_x, shot.shot_y).zone;
  }
  const z = String(shot.shot_zone || shot.zone || '').trim().toLowerCase();
  if (z === 'deep top 3') return 'top 3';
  if (z === 'midrange' || z === 'long midrange') return 'middle midrange';
  return z || 'other';
}

export function normalizeData(input = {}) {
  const data = clone(input) || {};
  data.team ||= { name: 'Spartans' };
  data.players ||= [];
  data.games ||= [];
  data.shots ||= [];
  data.events ||= [];
  data.freeThrows ||= data.free_throws || [];
  data.lineupStints ||= data.lineup_stints || [];
  data.reportNotes ||= data.report_notes || {};

  data.games.forEach(game => {
    const parsed = seasonFromGameId(game.game_id);
    if (parsed) {
      game.season_id ||= parsed.season_id;
      game.game_number ||= parsed.game_number;
    }
  });

  data.shots.forEach(shot => {
    shot.shot_zone = normalizeShotZone(shot);
    if (shot.approx_distance_m === undefined || shot.approx_distance_m === '') {
      shot.approx_distance_m = zoneFromXY(shot.shot_x, shot.shot_y).dist;
    }
  });

  const seasonMap = new Map();
  (data.seasons || []).forEach(season => { if (season?.season_id) seasonMap.set(season.season_id, season); });
  data.games.forEach(game => {
    if (game.season_id && !seasonMap.has(game.season_id)) seasonMap.set(game.season_id, { season_id: game.season_id, label: game.season_id });
  });
  data.seasons = Array.from(seasonMap.values()).sort((a,b) => String(a.season_id).localeCompare(String(b.season_id)));
  return data;
}

export function getPlayers(data) {
  data = normalizeData(data);
  const fromRoster = (data.players || []).map(p => p.player_id || p.name).filter(Boolean);
  if (fromRoster.length) return Array.from(new Set(fromRoster));
  const names = new Set();
  [...data.shots, ...data.events, ...data.freeThrows].forEach(row => {
    if (row.player) names.add(row.player);
    if (row.related_player) names.add(row.related_player);
    if (row.assisted_by) names.add(row.assisted_by);
    if (row.screen_assist_by) names.add(row.screen_assist_by);
  });
  return Array.from(names).filter(Boolean).sort();
}

export function getPlayerProfile(data, player) {
  data = normalizeData(data);
  return (data.players || []).find(p => (p.player_id || p.name) === player) || { player_id: player, name: player };
}
export function getSeasons(data) { data = normalizeData(data); return (data.seasons || []).map(s => s.season_id || s.label).filter(Boolean); }
export function gameSeason(data, gameId) { const game = (data.games || []).find(g => String(g.game_id) === String(gameId)); return game?.season_id || seasonFromGameId(gameId)?.season_id || ''; }
export function gameRecord(data, gameId) { data = normalizeData(data); return (data.games || []).find(g => String(g.game_id) === String(gameId)) || null; }
export function getGames(data, seasonId = 'ALL') { data = normalizeData(data); return (data.games || []).filter(g => seasonId === 'ALL' || g.season_id === seasonId); }

export function filterRows(data, rows, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  return (rows || []).filter(row =>
    (f.seasonId === 'ALL' || f.gameId !== 'ALL' || gameSeason(data, row.game_id) === f.seasonId) &&
    (f.gameId === 'ALL' || String(row.game_id) === String(f.gameId)) &&
    (f.half === 'ALL' || String(row.half) === String(f.half)) &&
    (f.player === 'ALL' || String(row.player) === String(f.player))
  );
}

export function rowCount(row) { return num(row?.count) || 1; }
export function sum(rows, getter) { return (rows || []).reduce((total, row) => total + num(getter(row)), 0); }
export function countEvents(events, type, subtype = null) { return sum(events, e => (type && e.event_type !== type) ? 0 : (subtype && e.event_subtype !== subtype) ? 0 : rowCount(e)); }
export function eventPoints(events, type, subtype = null) { return sum(events, e => (type && e.event_type !== type) ? 0 : (subtype && e.event_subtype !== subtype) ? 0 : e.points_created); }
export function shotPoints(shots) { return sum(shots, s => made(s) ? s.points : 0); }

export function fgStats(shots = []) {
  const madeShots = shots.filter(made);
  const FGA = shots.length;
  const FGM = madeShots.length;
  const twoPA = shots.filter(s => num(s.points) === 2).length;
  const twoPM = madeShots.filter(s => num(s.points) === 2).length;
  const threePA = shots.filter(s => num(s.points) === 3).length;
  const threePM = madeShots.filter(s => num(s.points) === 3).length;
  return { FGM, FGA, FG_pct: safe(FGM, FGA), twoPM, twoPA, twoP_pct: safe(twoPM, twoPA), threePM, threePA, threeP_pct: safe(threePM, threePA), shot_points: shotPoints(shots), eFG_pct: safe(FGM + 0.5 * threePM, FGA) };
}
export function ftStats(freeThrows = []) { const FTA = freeThrows.length; const FTM = freeThrows.filter(made).length; return { FTM, FTA, FT_pct: safe(FTM, FTA), ft_points: FTM }; }

export function onCourtStats(data, player, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const stints = filterRows(data, data.lineupStints, f).filter(stint => [stint.player_1, stint.player_2, stint.player_3, stint.player_4, stint.player_5].includes(player));
  const pointsFor = sum(stints, s => s.points_for);
  const pointsAgainst = sum(stints, s => s.points_against);
  const offPoss = sum(stints, s => s.off_poss);
  const defPoss = sum(stints, s => s.def_poss);
  const offRtg = safe(pointsFor * 100, offPoss);
  const defRtg = safe(pointsAgainst * 100, defPoss);
  return { OnCourt_Stints: stints.length, OnCourt_PF: pointsFor, OnCourt_PA: pointsAgainst, Player_plus_minus: pointsFor - pointsAgainst, OnCourt_Off_Poss: offPoss, OnCourt_Def_Poss: defPoss, OnCourt_Off_Rtg: offRtg, OnCourt_Def_Rtg: defRtg, OnCourt_Net_Rtg: offRtg !== null && defRtg !== null ? offRtg - defRtg : null };
}

function statsFrom(data, shots, freeThrows, events, lineupStints, allShots = null, player = null, filters = {}) {
  allShots ||= shots;
  const fg = fgStats(shots);
  const ft = ftStats(freeThrows);
  const PTS = fg.shot_points + ft.ft_points;
  const TOV = countEvents(events, 'turnover');
  const Poss_Used = fg.FGA + 0.44 * ft.FTA + TOV;
  const assistedFGM = shots.filter(s => made(s) && nonEmpty(s.assisted_by)).length;
  const unassistedFGM = fg.FGM - assistedFGM;
  const assistRows = player ? allShots.filter(s => made(s) && s.assisted_by === player) : shots.filter(s => made(s) && nonEmpty(s.assisted_by));
  const AST = assistRows.length;
  const AST_PTS = shotPoints(assistRows);
  const potentialAST = countEvents(events, 'creation', 'potential_assist');
  const advCreated = countEvents(events, 'creation', 'advantage_created');
  const advPts = eventPoints(events, 'creation', 'advantage_created');
  const paintCreated = countEvents(events, 'creation', 'paint_touch_created');
  const driveKickCreated = countEvents(events, 'creation', 'drive_kick_created');
  const driveKickPts = eventPoints(events, 'creation', 'drive_kick_created');
  const screenAST = countEvents(events, 'screen', 'screen_assist');
  const screenASTPts = eventPoints(events, 'screen', 'screen_assist');
  const screenOpp = countEvents(events, 'screen', 'screen_opportunity');
  const screenOppPts = eventPoints(events, 'screen', 'screen_opportunity');
  const screenAdv = countEvents(events, 'screen', 'advantage_created');
  const screenAdvPts = eventPoints(events, 'screen', 'advantage_created');
  const screenTotal = screenAST + screenOpp + screenAdv;
  const screenPts = screenASTPts + screenOppPts + screenAdvPts;
  const OREB = countEvents(events, 'rebound', 'offensive');
  const DREB = countEvents(events, 'rebound', 'defensive');
  const STL = countEvents(events, 'steal');
  const BLK = countEvents(events, 'block');
  const DEFLECTION = countEvents(events, 'deflection');
  const Charges_Drawn = countEvents(events, 'charge_drawn');
  const openShots = shots.filter(s => OPEN.has(s.contest));
  const lightShots = shots.filter(s => LIGHT.has(s.contest));
  const badShots = shots.filter(s => BAD.has(s.contest));
  const transitionShots = shots.filter(s => yes(s.transition));
  const lineupPF = sum(lineupStints, s => s.points_for);
  const lineupPA = sum(lineupStints, s => s.points_against);
  const offPoss = sum(lineupStints, s => s.off_poss);
  const defPoss = sum(lineupStints, s => s.def_poss);
  const offRtg = safe(lineupPF * 100, offPoss);
  const defRtg = safe(lineupPA * 100, defPoss);
  const stats = {
    player: player || 'TEAM',
    PTS, ...fg, ...ft, TS_pct: safe(PTS, 2 * (fg.FGA + 0.44 * ft.FTA)),
    AST, AST_PTS, AST_Rate: safe(AST, fg.FGM), AST_TO: safe(AST, TOV),
    Potential_AST: potentialAST,
    Adv_Created: advCreated, Adv_Created_PTS: advPts,
    Paint_Touches_Created: paintCreated,
    Drive_Kick_Created: driveKickCreated,
    Drive_Kick_3PA_Created: driveKickCreated,
    Drive_Kick_PTS: driveKickPts,
    Created_Paint_Drive_Adv: paintCreated + driveKickCreated + advCreated,
    Screen_AST: screenAST, Screen_AST_PTS: screenASTPts,
    Screen_Created_Opp: screenOpp, Screen_Created_Opp_PTS: screenOppPts,
    Screen_Adv: screenAdv, Screen_Adv_PTS: screenAdvPts,
    Screen_Created_Total: screenTotal, Screen_Created_PTS: screenPts,
    PTS_per_Screen_Created: safe(screenPts, screenTotal),
    OREB, DREB, REB: OREB + DREB,
    STL, BLK, DEFLECTION, Deflections: DEFLECTION,
    Defensive_Playmaking: STL + BLK + DEFLECTION + Charges_Drawn,
    TOV, Fouls: countEvents(events, 'foul'), Charges_Drawn,
    Poss_Used, PTS_per_Poss: safe(PTS, Poss_Used),
    Assisted_FGM: assistedFGM, Unassisted_FGM: unassistedFGM, Assisted_FG_Rate: safe(assistedFGM, fg.FGM),
    Open_FGA: openShots.length, Open_FGM: openShots.filter(made).length, Open_PTS: shotPoints(openShots), Open_FGA_Rate: safe(openShots.length, fg.FGA), Open_PPS: safe(shotPoints(openShots), openShots.length),
    Light_Contest_FGA: lightShots.length, Light_Contest_FGM: lightShots.filter(made).length, Light_Contest_PTS: shotPoints(lightShots), Light_Contest_Rate: safe(lightShots.length, fg.FGA), Light_Contest_PPS: safe(shotPoints(lightShots), lightShots.length),
    Bad_Shot_FGA: badShots.length, Bad_Shot_FGM: badShots.filter(made).length, Bad_Shot_PTS: shotPoints(badShots), Bad_Shot_Rate: safe(badShots.length, fg.FGA), Bad_Shot_PPS: safe(shotPoints(badShots), badShots.length),
    Transition_FGA: transitionShots.length, Transition_FGM: transitionShots.filter(made).length, Transition_PTS: shotPoints(transitionShots), Transition_PPS: safe(shotPoints(transitionShots), transitionShots.length),
    Lineup_Off_Poss: offPoss, Lineup_Def_Poss: defPoss, Lineup_PF: lineupPF, Lineup_PA: lineupPA, Lineup_Net: lineupPF - lineupPA,
    Off_Rtg: offRtg, Def_Rtg: defRtg, Net_Rtg: offRtg !== null && defRtg !== null ? offRtg - defRtg : null
  };
  if (player) Object.assign(stats, onCourtStats(data, player, filters));
  return stats;
}

export function getTeamStats(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters);
  return statsFrom(data, filterRows(data, data.shots, f), filterRows(data, data.freeThrows, f), filterRows(data, data.events, f), filterRows(data, data.lineupStints, f), null, null, f);
}
export function getPlayerStats(data, player, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters({ ...filters, player });
  const teamFilter = normalizeFilters({ ...filters, player: 'ALL' });
  const lineupStints = filterRows(data, data.lineupStints, teamFilter).filter(stint => [stint.player_1, stint.player_2, stint.player_3, stint.player_4, stint.player_5].includes(player));
  return statsFrom(data, filterRows(data, data.shots, f), filterRows(data, data.freeThrows, f), filterRows(data, data.events, f), lineupStints, filterRows(data, data.shots, teamFilter), player, teamFilter);
}
export function getAllPlayerStats(data, filters = {}) {
  data = normalizeData(data);
  const teamStats = getTeamStats(data, { ...filters, player: 'ALL' });
  return getPlayers(data).map(player => {
    const stats = getPlayerStats(data, player, filters);
    stats.Usage_pct = safe(stats.Poss_Used, teamStats.Poss_Used);
    stats.Creation_Value = num(stats.AST) + num(stats.Potential_AST) + num(stats.Adv_Created) + num(stats.Paint_Touches_Created) + num(stats.Drive_Kick_Created);
    stats.Def_Activity = num(stats.STL) + num(stats.BLK) + num(stats.DEFLECTION) + num(stats.Charges_Drawn);
    return stats;
  });
}

export function getLineupStats(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const map = new Map();
  filterRows(data, data.lineupStints, f).forEach(stint => {
    const label = stint.lineup_label || [stint.player_1, stint.player_2, stint.player_3, stint.player_4, stint.player_5].filter(Boolean).join(' / ');
    if (!map.has(label)) map.set(label, { lineup_label: label, stints: 0, points_for: 0, points_against: 0, off_poss: 0, def_poss: 0 });
    const row = map.get(label); row.stints += 1; row.points_for += num(stint.points_for); row.points_against += num(stint.points_against); row.off_poss += num(stint.off_poss); row.def_poss += num(stint.def_poss);
  });
  return Array.from(map.values()).map(row => { row.net_points = row.points_for - row.points_against; row.off_rating = safe(row.points_for * 100, row.off_poss); row.def_rating = safe(row.points_against * 100, row.def_poss); row.net_rating = row.off_rating !== null && row.def_rating !== null ? row.off_rating - row.def_rating : null; return row; }).sort((a,b) => b.net_points - a.net_points);
}

export function shotBreakdown(shots = [], key = 'shot_zone', buckets = ZONES) {
  return buckets.map(label => {
    const rows = shots.filter(shot => String(shot[key] || '') === label);
    const FGA = rows.length; const FGM = rows.filter(made).length; const PTS = shotPoints(rows);
    return { label, FGM, FGA, FG_pct: safe(FGM, FGA), rate: safe(FGA, shots.length), PTS, PPS: safe(PTS, FGA), display: ratioText(FGM, FGA) };
  });
}
export function getZoneBreakdown(data, filters = {}) { data = normalizeData(data); return shotBreakdown(filterRows(data, data.shots, normalizeFilters(filters)), 'shot_zone', ZONES); }
export function getContestBreakdown(data, filters = {}) { data = normalizeData(data); return shotBreakdown(filterRows(data, data.shots, normalizeFilters(filters)), 'contest', CONTESTS); }
export function getEventBreakdown(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const map = new Map();
  filterRows(data, data.events, f).forEach(event => { const key = `${event.event_type || ''}||${event.event_subtype || ''}`; if (!map.has(key)) map.set(key, { type: event.event_type || '', subtype: event.event_subtype || '', count: 0, points_created: 0 }); const row = map.get(key); row.count += rowCount(event); row.points_created += num(event.points_created); });
  return Array.from(map.values()).sort((a,b) => b.count - a.count || String(a.type).localeCompare(String(b.type)));
}

export function shotKey(shot) { return shot.shot_id || `${shot.game_id || ''}|${shot.half || ''}|${shot.player || ''}|${shot.shot_x || ''}|${shot.shot_y || ''}|${shot.result || ''}|${shot.points || ''}`; }
export function getShotChartData(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const shots = filterRows(data, data.shots, f);
  return { scope: f.player === 'ALL' ? 'team' : 'player', filters: f, shot_count: shots.length, shots: shots.map(s => ({ id: shotKey(s), shot_id: s.shot_id || shotKey(s), game_id: s.game_id, half: s.half, player: s.player, result: s.result, points: num(s.points), x: num(s.shot_x), y: num(s.shot_y), zone: s.shot_zone || '', type: s.shot_type || '', contest: s.contest || '', assisted_by: s.assisted_by || '', screen_by: s.screen_assist_by || '', screen_type: s.screen_type || '', transition: s.transition || '', paint_touch: s.paint_touch || '', drive_kick: s.drive_kick || '', notes: s.notes || '' })), zone_breakdown: shotBreakdown(shots, 'shot_zone', ZONES), contest_breakdown: shotBreakdown(shots, 'contest', CONTESTS) };
}

export function statLine(stats) { return { made: num(stats.FGM), attempted: num(stats.FGA), pct: pctValue(stats.FG_pct), pct_raw: stats.FG_pct, display: ratioText(stats.FGM, stats.FGA, stats.FG_pct) }; }
export function twoLine(stats) { return { made: num(stats.twoPM), attempted: num(stats.twoPA), pct: pctValue(stats.twoP_pct), pct_raw: stats.twoP_pct, display: ratioText(stats.twoPM, stats.twoPA, stats.twoP_pct) }; }
export function threeLine(stats) { return { made: num(stats.threePM), attempted: num(stats.threePA), pct: pctValue(stats.threeP_pct), pct_raw: stats.threeP_pct, display: ratioText(stats.threePM, stats.threePA, stats.threeP_pct) }; }
export function ftLine(stats) { return { made: num(stats.FTM), attempted: num(stats.FTA), pct: pctValue(stats.FT_pct), pct_raw: stats.FT_pct, display: ratioText(stats.FTM, stats.FTA, stats.FT_pct) }; }

export function compactStats(stats) {
  return {
    player: stats.player || 'TEAM', PTS: num(stats.PTS),
    FG: statLine(stats), twoPoint: twoLine(stats), threePoint: threeLine(stats), FT: ftLine(stats),
    FG_pct: pctValue(stats.FG_pct), twoP_pct: pctValue(stats.twoP_pct), threeP_pct: pctValue(stats.threeP_pct), FT_pct: pctValue(stats.FT_pct), eFG_pct: pctValue(stats.eFG_pct), TS_pct: pctValue(stats.TS_pct),
    AST: num(stats.AST), AST_PTS: num(stats.AST_PTS), AST_Rate_pct: pctValue(stats.AST_Rate), AST_TO: stats.AST_TO === null ? null : round(stats.AST_TO, 2), Extra_Potential_AST: num(stats.Potential_AST),
    Advantage_Created: num(stats.Adv_Created), Advantage_Created_PTS: num(stats.Adv_Created_PTS), Paint_Touch_Created: num(stats.Paint_Touches_Created), Drive_Kick_Created: num(stats.Drive_Kick_Created), Created_Paint_Touch_Drive_Kick_Adv: num(stats.Created_Paint_Drive_Adv),
    Screen_AST: num(stats.Screen_AST), Screen_AST_PTS: num(stats.Screen_AST_PTS), Screen_Opp_Created: num(stats.Screen_Created_Opp), Screen_Adv_Created: num(stats.Screen_Adv), Screen_ADV_OPP_AST: num(stats.Screen_Created_Total), Screen_Created_PTS: num(stats.Screen_Created_PTS), PTS_per_Screen_Created: stats.PTS_per_Screen_Created === null ? null : round(stats.PTS_per_Screen_Created, 2),
    OR: num(stats.OREB), DR: num(stats.DREB), REB: num(stats.REB), STL: num(stats.STL), BLK: num(stats.BLK), Deflections: num(stats.DEFLECTION), Defensive_Playmaking: num(stats.Defensive_Playmaking), TOV: num(stats.TOV), Fouls: num(stats.Fouls), Charges_Drawn: num(stats.Charges_Drawn),
    Poss_Used: round(stats.Poss_Used, 2), Usage_pct: pctValue(stats.Usage_pct), PTS_per_Poss: stats.PTS_per_Poss === null ? null : round(stats.PTS_per_Poss, 2),
    Open_FGM_FGA: { made: num(stats.Open_FGM), attempted: num(stats.Open_FGA), display: `${num(stats.Open_FGM)}/${num(stats.Open_FGA)}` }, Open_Shot_Rate_pct: pctValue(stats.Open_FGA_Rate), Open_PPS: stats.Open_PPS === null ? null : round(stats.Open_PPS, 2),
    Light_Contest_FGM_FGA: { made: num(stats.Light_Contest_FGM), attempted: num(stats.Light_Contest_FGA), display: `${num(stats.Light_Contest_FGM)}/${num(stats.Light_Contest_FGA)}` }, Light_Contest_Shot_Rate_pct: pctValue(stats.Light_Contest_Rate), Light_Contest_PPS: stats.Light_Contest_PPS === null ? null : round(stats.Light_Contest_PPS, 2),
    Bad_Shot_FGM_FGA: { made: num(stats.Bad_Shot_FGM), attempted: num(stats.Bad_Shot_FGA), display: `${num(stats.Bad_Shot_FGM)}/${num(stats.Bad_Shot_FGA)}` }, Bad_Shot_Rate_pct: pctValue(stats.Bad_Shot_Rate), Bad_Shot_PPS: stats.Bad_Shot_PPS === null ? null : round(stats.Bad_Shot_PPS, 2),
    Transition_FGM_FGA: { made: num(stats.Transition_FGM), attempted: num(stats.Transition_FGA), display: `${num(stats.Transition_FGM)}/${num(stats.Transition_FGA)}` }, Transition_PTS: num(stats.Transition_PTS), Transition_PPS: stats.Transition_PPS === null ? null : round(stats.Transition_PPS, 2),
    Assisted_FGM: num(stats.Assisted_FGM), Unassisted_FGM: num(stats.Unassisted_FGM), Assisted_FG_Rate_pct: pctValue(stats.Assisted_FG_Rate),
    Player_plus_minus: stats.Player_plus_minus ?? stats.Lineup_Net ?? 0, Off_Rtg: stats.Off_Rtg === null ? null : round(stats.Off_Rtg, 1), Def_Rtg: stats.Def_Rtg === null ? null : round(stats.Def_Rtg, 1), Net_Rtg: stats.Net_Rtg === null ? null : round(stats.Net_Rtg, 1)
  };
}

export function allPlayersAdvancedRow(stats) {
  return { player: stats.player || '', PTS: num(stats.PTS), Usage_pct: pctValue(stats.Usage_pct), Poss_Used: round(stats.Poss_Used, 1), FG: statLine(stats), threePoint: threeLine(stats), FT: ftLine(stats), TS_pct: pctValue(stats.TS_pct), AST: num(stats.AST), TOV: num(stats.TOV), AST_TO: stats.AST_TO === null ? null : round(stats.AST_TO, 2), Extra_Potential_AST: num(stats.Potential_AST), Created_Paint_Touch_Drive_Kick_Adv: num(stats.Created_Paint_Drive_Adv), Screen_ADV_OPP_AST: num(stats.Screen_Created_Total), OR: num(stats.OREB), DR: num(stats.DREB), STL: num(stats.STL), BLK: num(stats.BLK), Deflections: num(stats.DEFLECTION), Bad_Shot_Rate_pct: pctValue(stats.Bad_Shot_Rate), plus_minus: stats.Player_plus_minus ?? 0, raw_stats: compactStats(stats) };
}

export function getAllPlayersAdvancedTable(data, filters = {}) { return getAllPlayerStats(data, filters).map(allPlayersAdvancedRow); }

export function leaderboardRows(players, key, limit = 7, min = 0) { return players.slice().filter(p => num(p[key]) >= min).sort((a,b) => num(b[key]) - num(a[key])).slice(0, limit); }
export function getStatLeaders(data, filters = {}) {
  const players = getAllPlayerStats(data, filters);
  return {
    scoring_leaders: players.slice().sort((a,b) => b.PTS - a.PTS).map(s => ({ player: s.player, PTS: s.PTS, FG: statLine(s), threePoint: threeLine(s), FT: ftLine(s), eFG_pct: pctValue(s.eFG_pct), TS_pct: pctValue(s.TS_pct), PTS_per_Poss: s.PTS_per_Poss === null ? null : round(s.PTS_per_Poss, 2), Usage_pct: pctValue(s.Usage_pct) })),
    creation_leaders: players.slice().sort((a,b) => (b.AST + b.Potential_AST + b.Adv_Created + b.Paint_Touches_Created + b.Drive_Kick_Created) - (a.AST + a.Potential_AST + a.Adv_Created + a.Paint_Touches_Created + a.Drive_Kick_Created)).map(s => ({ player: s.player, AST: s.AST, AST_PTS: s.AST_PTS, Extra_Potential_AST: s.Potential_AST, ADV_Created: s.Adv_Created, ADV_PTS: s.Adv_Created_PTS, Paint_Touch_Created: s.Paint_Touches_Created, Drive_Kick_Created: s.Drive_Kick_Created, AST_TO: s.AST_TO === null ? null : round(s.AST_TO, 2) })),
    screening_leaders: players.slice().sort((a,b) => b.Screen_Created_Total - a.Screen_Created_Total).map(s => ({ player: s.player, Screen_AST: s.Screen_AST, Screen_Opp_Created: s.Screen_Created_Opp, Screen_Adv_Created: s.Screen_Adv, Total: s.Screen_Created_Total, PTS: s.Screen_Created_PTS, PTS_per_Screen: s.PTS_per_Screen_Created === null ? null : round(s.PTS_per_Screen_Created, 2) })),
    rebounding_defense_leaders: players.slice().sort((a,b) => (b.REB + b.Def_Activity) - (a.REB + a.Def_Activity)).map(s => ({ player: s.player, OR: s.OREB, DR: s.DREB, REB: s.REB, STL: s.STL, BLK: s.BLK, Deflections: s.DEFLECTION, Charges: s.Charges_Drawn, Def_Activity: s.Def_Activity }))
  };
}

export function getHalfSplits(data, filters = {}) {
  const f = normalizeFilters(filters);
  return ['1H','2H','OT'].map(half => { const s = getTeamStats(data, { ...f, half, player: 'ALL' }); return { half, PTS: s.PTS, FG: statLine(s), threePoint: threeLine(s), FT: ftLine(s), TS_pct: pctValue(s.TS_pct), AST: s.AST, TOV: s.TOV, Fouls: s.Fouls, OR: s.OREB, DR: s.DREB, STL: s.STL, BLK: s.BLK, Bad_Shot_Rate_pct: pctValue(s.Bad_Shot_Rate), raw_stats: compactStats(s) }; }).filter(row => row.PTS || row.FG.attempted || row.FT.attempted || row.AST || row.TOV || row.OR || row.DR || row.Fouls || row.STL || row.BLK);
}

export function getTeamSummaryCards(data, filters = {}) {
  const s = getTeamStats(data, { ...filters, player: 'ALL' });
  return [
    { key: 'PTS', label: 'PTS', value: s.PTS }, { key: 'FG', label: 'FG', value: `${s.FGM}/${s.FGA}` }, { key: 'FG_pct', label: 'FG%', value: pctText(s.FG_pct) },
    { key: '2PT', label: '2PT', value: `${s.twoPM}/${s.twoPA}` }, { key: '3PT', label: '3PT', value: `${s.threePM}/${s.threePA}` }, { key: '3PT_pct', label: '3PT%', value: pctText(s.threeP_pct) },
    { key: 'FT', label: 'FT', value: `${s.FTM}/${s.FTA}` }, { key: 'eFG_pct', label: 'eFG%', value: pctText(s.eFG_pct) }, { key: 'TS_pct', label: 'TS%', value: pctText(s.TS_pct) },
    { key: 'AST', label: 'AST', value: s.AST }, { key: 'AST_PTS', label: 'AST PTS', value: s.AST_PTS }, { key: 'Potential_AST', label: 'Extra Potential AST', value: s.Potential_AST },
    { key: 'ADV_Created', label: 'ADV Created', value: s.Adv_Created }, { key: 'Screen_Created', label: 'Screen Created', value: s.Screen_Created_Total }, { key: 'Screen_PTS', label: 'Screen PTS', value: s.Screen_Created_PTS },
    { key: 'TOV', label: 'TOV', value: s.TOV }, { key: 'Poss_Used', label: 'Est Poss Used', value: round(s.Poss_Used,1) }, { key: 'PTS_per_Poss', label: 'PTS/Poss', value: round(s.PTS_per_Poss,2) },
    { key: 'Open_Shot_Rate', label: 'Open Shot Rate', value: pctText(s.Open_FGA_Rate) }, { key: 'Light_Contest_Shot_Rate', label: 'Light Contest Shot Rate', value: pctText(s.Light_Contest_Rate) }, { key: 'Bad_Shot_Rate', label: 'Bad Shot Rate', value: pctText(s.Bad_Shot_Rate) },
    { key: 'Transition_PTS', label: 'Transition PTS', value: s.Transition_PTS }, { key: 'REB', label: 'REB', value: s.REB }, { key: 'Def_Activity', label: 'Def Activity', value: s.Defensive_Playmaking },
    { key: 'Off_Rtg', label: 'Off Rtg', value: dashNull(round(s.Off_Rtg,1)) }, { key: 'Def_Rtg', label: 'Def Rtg', value: dashNull(round(s.Def_Rtg,1)) }, { key: 'Net', label: 'Net', value: round(s.Lineup_Net,1) || 0 }
  ];
}

export function getTeamAdvancedStats(data, filters = {}) {
  const s = getTeamStats(data, { ...filters, player: 'ALL' });
  const lineup = getLineupStats(data, filters);
  return {
    scoring_efficiency: { PTS: s.PTS, FGM_FGA: `${s.FGM}/${s.FGA}`, FG_pct: pctText(s.FG_pct), twoPM_twoPA: `${s.twoPM}/${s.twoPA}`, twoP_pct: pctText(s.twoP_pct), threePM_threePA: `${s.threePM}/${s.threePA}`, threeP_pct: pctText(s.threeP_pct), FTM_FTA: `${s.FTM}/${s.FTA}`, FT_pct: pctText(s.FT_pct), eFG_pct: pctText(s.eFG_pct), TS_pct: pctText(s.TS_pct), PTS_per_Poss: round(s.PTS_per_Poss,2) },
    creation_passing: { AST: s.AST, AST_PTS: s.AST_PTS, AST_Rate: pctText(s.AST_Rate), AST_TO: round(s.AST_TO,2), Extra_Potential_AST: s.Potential_AST, ADV_Created: s.Adv_Created, ADV_Created_PTS: s.Adv_Created_PTS, Paint_Touch_Created: s.Paint_Touches_Created, Drive_Kick_Created: s.Drive_Kick_Created },
    screening: { Screen_AST: s.Screen_AST, Screen_AST_PTS: s.Screen_AST_PTS, Screen_Opp_Created: s.Screen_Created_Opp, Screen_Adv_Created: s.Screen_Adv, Screen_Created_Total: s.Screen_Created_Total, Screen_Created_PTS: s.Screen_Created_PTS, PTS_per_Screen_Created: round(s.PTS_per_Screen_Created,2) },
    rebounding_defense: { OREB: s.OREB, DREB: s.DREB, REB: s.REB, STL: s.STL, BLK: s.BLK, Deflections: s.DEFLECTION, Defensive_Playmaking: s.Defensive_Playmaking, Fouls: s.Fouls, Charges_Drawn: s.Charges_Drawn },
    shot_quality: { Open_FGM_FGA: `${s.Open_FGM}/${s.Open_FGA}`, Open_Shot_Rate: pctText(s.Open_FGA_Rate), Open_PPS: round(s.Open_PPS,2), Light_Contest_FGM_FGA: `${s.Light_Contest_FGM}/${s.Light_Contest_FGA}`, Light_Contest_Shot_Rate: pctText(s.Light_Contest_Rate), Light_Contest_PPS: round(s.Light_Contest_PPS,2), Bad_Shot_FGM_FGA: `${s.Bad_Shot_FGM}/${s.Bad_Shot_FGA}`, Bad_Shot_Rate: pctText(s.Bad_Shot_Rate), Bad_Shot_PPS: round(s.Bad_Shot_PPS,2), Transition_FGM_FGA: `${s.Transition_FGM}/${s.Transition_FGA}`, Transition_PTS: s.Transition_PTS, Transition_PPS: round(s.Transition_PPS,2), Assisted_FGM: s.Assisted_FGM, Unassisted_FGM: s.Unassisted_FGM, Assisted_FG_Rate: pctText(s.Assisted_FG_Rate) },
    lineup_impact: { rows: lineup, best_plus_minus: lineup[0] || null, worst_plus_minus: lineup.slice().sort((a,b)=>a.net_points-b.net_points)[0] || null }
  };
}

export function attentionCutoffs(half = 'ALL') { const full = String(half || 'ALL') === 'ALL'; return { full, turnovers: full ? 10 : 5, turnoversMajor: full ? 14 : 7, threePA: full ? 12 : 6, threePAHigh: full ? 18 : 9, fga: full ? 35 : 18, openFGA: full ? 10 : 5, lightFGA: full ? 10 : 5, badFGA: full ? 8 : 4, zoneFGA: full ? 3 : 2, misses: full ? 20 : 10, fta: full ? 6 : 3 }; }
export function getNeedsAttention(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const team = getTeamStats(data, f); const shots = filterRows(data, data.shots, { ...f, player: 'ALL' }); const events = filterRows(data, data.events, { ...f, player: 'ALL' }); return attentionItems(team, shots, events, f.half);
}
function attentionItems(team, shots, events, half = 'ALL') {
  const c = attentionCutoffs(half); const items = []; const add = (title, message, priority = 1) => items.push({ title, message, priority }); const fgText = (m,a) => `${num(m)}/${num(a)}`; const tov = countEvents(events, 'turnover'); const tovRate = safe(tov, team.Poss_Used); const misses = Math.max(0, team.FGA - team.FGM); const orbRate = safe(team.OREB, misses);
  if (team.threePA >= c.threePA && team.threeP_pct !== null && team.threeP_pct < 0.30) add('3PT shooting', `3PT shooting was ${fgText(team.threePM, team.threePA)} (${pctText(team.threeP_pct)}) on ${team.threePA >= c.threePAHigh ? 'very high' : 'high'} volume.`, 5);
  if (team.FGA >= c.fga && team.FG_pct !== null && team.FG_pct < 0.38) add('Overall efficiency', `Overall FG was ${fgText(team.FGM, team.FGA)} (${pctText(team.FG_pct)}).`, 4);
  if (tov >= c.turnovers || (tov >= Math.max(6, c.turnovers - 2) && tovRate !== null && tovRate >= 0.16)) add('Turnovers', `Turnovers: ${tov}${tovRate !== null ? ` (${pctText(tovRate)} of used possessions)` : ''}. For 2×20 halves, ${c.turnovers}+ is worth flagging.`, 4);
  const openPct = safe(team.Open_FGM, team.Open_FGA); const lightPct = safe(team.Light_Contest_FGM, team.Light_Contest_FGA);
  if (team.Open_FGA >= c.openFGA && openPct !== null && openPct < 0.40) add('Open-shot conversion', `Open looks were ${fgText(team.Open_FGM, team.Open_FGA)} (${pctText(openPct)}), ${round(team.Open_PPS, 2)} PPS.`, 3);
  if (team.Light_Contest_FGA >= c.lightFGA && lightPct !== null && lightPct < 0.35) add('Light-contest conversion', `Light-contest shots were ${fgText(team.Light_Contest_FGM, team.Light_Contest_FGA)} (${pctText(lightPct)}), ${round(team.Light_Contest_PPS, 2)} PPS.`, 2);
  if (team.Bad_Shot_FGA >= c.badFGA && team.Bad_Shot_Rate !== null && team.Bad_Shot_Rate >= 0.20) add('Bad-shot diet', `Bad shots were ${fgText(team.Bad_Shot_FGM, team.Bad_Shot_FGA)} and made up ${pctText(team.Bad_Shot_Rate)} of attempts.`, 3);
  if (team.FTA >= c.fta && team.FT_pct !== null && team.FT_pct < 0.65) add('Free throws', `Free throws were ${fgText(team.FTM, team.FTA)} (${pctText(team.FT_pct)}).`, 2);
  if (misses >= c.misses && orbRate !== null && orbRate < 0.15) add('Offensive glass', `Only ${team.OREB} OREB on ${misses} missed shots (${pctText(orbRate)}).`, 2);
  const zones = shotBreakdown(shots, 'shot_zone', ZONES).filter(z => z.FGA >= c.zoneFGA && ((z.FG_pct !== null && z.FG_pct < 0.30) || (z.PPS !== null && z.PPS < 0.75))).sort((a,b)=>(b.FGA-a.FGA)||(num(a.PPS)-num(b.PPS))).slice(0,3);
  if (zones.length) add('Cold zones', zones.map(z => `${z.label}: ${z.FGM}/${z.FGA}, ${round(z.PPS,2)} PPS`).join('; '), 2);
  return items.sort((a,b)=>b.priority-a.priority).slice(0,8);
}

export function getGameHeader(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const game = f.gameId === 'ALL' ? null : gameRecord(data, f.gameId); const team = getTeamStats(data, { ...f, player:'ALL' });
  const title = game ? `${game.game_id}${game.opponent ? ` vs ${game.opponent}` : ''}` : `${f.seasonId === 'ALL' ? 'All seasons' : f.seasonId} / All games`;
  return { title, season_id: f.seasonId, game_id: f.gameId, half: f.half, player: f.player, date: game?.date || '', opponent: game?.opponent || '', result: game?.result || '', score: game ? { team: game.team_score ?? team.PTS, opponent: game.opponent_score ?? null, display: `${game.team_score ?? team.PTS}${game.opponent_score !== undefined ? ` - ${game.opponent_score}` : ''}` } : null };
}

export function getReportOverview(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const team = getTeamStats(data, { ...f, player:'ALL' }); const players = getAllPlayerStats(data, f); const header = getGameHeader(data, f); const leaders = getStatLeaders(data, f);
  const top = (arr, key = 'value') => arr && arr[0] ? arr[0] : null; const zoneBest = getZoneBreakdown(data, { ...f, player:'ALL' }).filter(z=>z.FGA>0).sort((a,b)=>num(b.PPS)-num(a.PPS))[0] || null;
  return { header, leader_cards: { top_scorer: top(leaders.scoring_leaders), top_creator: players.slice().sort((a,b)=>b.Creation_Value-a.Creation_Value).map(p=>({player:p.player, value:p.Creation_Value, label:`${p.Creation_Value} creation actions` }))[0] || null, best_screener: top(leaders.screening_leaders.map(r=>({player:r.player,value:r.Total,label:`${r.Total} screen-created`}))), top_rebounder: top(leaders.rebounding_defense_leaders.map(r=>({player:r.player,value:r.REB,label:`${r.REB} reb`}))), defensive_activity: top(leaders.rebounding_defense_leaders.map(r=>({player:r.player,value:r.Def_Activity,label:`${r.Def_Activity} plays`}))) }, notes: { shot_quality: `Open shot rate ${pctText(team.Open_FGA_Rate)} · Light contest rate ${pctText(team.Light_Contest_Rate)} · Bad shot rate ${pctText(team.Bad_Shot_Rate)} · Assisted FG rate ${pctText(team.Assisted_FG_Rate)}`, best_zone: zoneBest ? `${zoneBest.label}: ${zoneBest.FGM}/${zoneBest.FGA}, ${round(zoneBest.PPS,2)} PPS` : '—', needs_attention: getNeedsAttention(data, f) }, story_cards: { efficiency: { main: `${team.PTS} pts · ${pctText(team.eFG_pct)} eFG`, sub: `FG ${team.FGM}/${team.FGA}, 3PT ${team.threePM}/${team.threePA}, FT ${team.FTM}/${team.FTA}, TS ${pctText(team.TS_pct)}` }, shot_quality: { main: `${pctText(team.Open_FGA_Rate)} open · ${pctText(team.Light_Contest_Rate)} light · ${pctText(team.Bad_Shot_Rate)} bad`, sub: `Open ${team.Open_FGM}/${team.Open_FGA}, light ${team.Light_Contest_FGM}/${team.Light_Contest_FGA}, bad ${team.Bad_Shot_FGM}/${team.Bad_Shot_FGA}` }, creation_screening: { main: `${team.AST} AST · ${team.Screen_Created_Total} screens`, sub: `Extra potential AST ${team.Potential_AST}, advantage created ${team.Adv_Created}.` }, possession_battle: { main: `${team.TOV} TOV · ${team.REB} REB`, sub: `OREB ${team.OREB}, DREB ${team.DREB}, defensive activity ${team.Defensive_Playmaking}.` } }, half_splits: getHalfSplits(data, f), team_control_dashboard: { shooting: `${pctText(team.eFG_pct)} eFG`, shot_quality: `${pctText(team.Open_FGA_Rate)} open`, possessions: `${round(team.PTS_per_Poss,2)} pts/poss`, glass_def_activity: `${team.REB} REB` } };
}

export function getGameReport(data, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters(filters); const teamStats = getTeamStats(data, { ...f, player:'ALL' }); const playerStats = f.player === 'ALL' ? null : getPlayerStats(data, f.player, f); if (playerStats) playerStats.Usage_pct = safe(playerStats.Poss_Used, teamStats.Poss_Used);
  return { schema: 'spartans-game-report', schema_version: '2.0', generated_at: new Date().toISOString(), filters: { season_id:f.seasonId, game_id:f.gameId, half:f.half, player:f.player }, index: { seasons: getSeasons(data), games: getGames(data, f.seasonId), players: getPlayers(data) }, game: getGameHeader(data, f), overview: getReportOverview(data, f), team_summary: { raw: teamStats, compact: compactStats(teamStats), cards: getTeamSummaryCards(data, f) }, selected_player: playerStats ? compactStats(playerStats) : null, all_players_advanced_table: getAllPlayersAdvancedTable(data, f), stat_leaders: getStatLeaders(data, f), team_advanced_stats: getTeamAdvancedStats(data, f), shot_chart_quality: { shot_chart: getShotChartData(data, f), zone_breakdown: getZoneBreakdown(data, f), contest_breakdown: getContestBreakdown(data, f) }, event_breakdown: getEventBreakdown(data, f), lineup_impact: getLineupStats(data, f), raw_filtered_rows: { shots: filterRows(data, data.shots, f), events: filterRows(data, data.events, f), freeThrows: filterRows(data, data.freeThrows, f), lineupStints: filterRows(data, data.lineupStints, f) } };
}

export function getPlayerAdvancedTabs(data, player, filters = {}) {
  data = normalizeData(data); const f = normalizeFilters({ ...filters, player }); const s = getPlayerStats(data, player, f); const team = getTeamStats(data, { ...filters, player:'ALL' }); s.Usage_pct = safe(s.Poss_Used, team.Poss_Used);
  return { player: getPlayerProfile(data, player), filters: { season_id:f.seasonId, game_id:f.gameId, half:f.half, player }, scoring: { points_efficiency: { PTS: s.PTS, FGM_FGA: `${s.FGM}/${s.FGA}`, FG_pct: pctText(s.FG_pct), twoPM_twoPA: `${s.twoPM}/${s.twoPA}`, twoP_pct: pctText(s.twoP_pct), threePM_threePA: `${s.threePM}/${s.threePA}`, threeP_pct: pctText(s.threeP_pct), FTM_FTA: `${s.FTM}/${s.FTA}`, FT_pct: pctText(s.FT_pct), eFG_pct: pctText(s.eFG_pct), TS_pct: pctText(s.TS_pct), PTS_per_Poss: round(s.PTS_per_Poss,2) }, shot_quality: compactStats(s), shot_chart: getShotChartData(data, f), zone_breakdown: getZoneBreakdown(data, f), contest_breakdown: getContestBreakdown(data, f) }, creation_passing: getTeamAdvancedStats(data, { ...f, player }).creation_passing, screening: getTeamAdvancedStats(data, { ...f, player }).screening, rebounding_defense: getTeamAdvancedStats(data, { ...f, player }).rebounding_defense, lineup_impact: onCourtStats(data, player, { ...filters, player:'ALL' }), raw_stats: compactStats(s) };
}

export function getPlayerReport(data, player, filters = {}) { return getPlayerAdvancedTabs(data, player, filters); }
export function getSeasonReport(data, seasonId, extraFilters = {}) { return getGameReport(data, { ...extraFilters, seasonId, gameId: 'ALL' }); }
export function getGameReports(data, seasonId = 'ALL') { data = normalizeData(data); return getGames(data, seasonId).map(g => getGameReport(data, { seasonId: g.season_id || gameSeason(data, g.game_id), gameId: g.game_id, half: 'ALL', player: 'ALL' })); }

export default { ZONES, CONTESTS, SHOT_TYPES, normalizeData, normalizeFilters, seasonFromGameId, getPlayers, getPlayerProfile, getSeasons, getGames, gameRecord, filterRows, fgStats, ftStats, getTeamStats, getPlayerStats, getAllPlayerStats, getAllPlayersAdvancedTable, onCourtStats, getLineupStats, getZoneBreakdown, getContestBreakdown, getEventBreakdown, getShotChartData, getNeedsAttention, getHalfSplits, getTeamSummaryCards, getTeamAdvancedStats, getStatLeaders, getReportOverview, getGameReport, getSeasonReport, getPlayerReport, getPlayerAdvancedTabs, getGameReports, zoneFromXY, normalizeShotZone, shotKey, compactStats, allPlayersAdvancedRow, pctValue, pctText, ratioText };
