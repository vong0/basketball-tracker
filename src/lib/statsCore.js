// Spartans Stats Core v0.5.2
// Headless stat/report engine extracted from the standalone basketball tracker.
// No DOM. No localStorage. No tracker UI. Works in Vite/React or plain browser ES modules.

export const ZONES = ['rim','paint','left midrange','middle midrange','right midrange','left corner 3','right corner 3','left wing 3','right wing 3','top 3','other'];
export const CONTESTS = ['wide open','open','light','heavy','blocked/smothered'];
export const SHOT_TYPES = ['catch-and-shoot','pull-up','layup','floater','runner','stepback','post','putback','cut','transition','other'];

const OPEN = new Set(['wide open','open']);
const LIGHT = new Set(['light']);
const BAD = new Set(['heavy','blocked/smothered']);

export function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function made(row) {
  return String(row?.result || '').toLowerCase() === 'make';
}

export function yes(value) {
  return String(value || '').toLowerCase() === 'yes' || value === true;
}

export function nonEmpty(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function safe(numerator, denominator) {
  numerator = Number(numerator);
  denominator = Number(denominator);
  return denominator ? numerator / denominator : null;
}

export function round(value, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return Number(Number(value).toFixed(digits));
}

export function pctValue(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return Number((Number(value) * 100).toFixed(digits));
}

export function pctText(value, digits = 1) {
  const p = pctValue(value, digits);
  return p === null ? '—' : `${p}%`;
}

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
    const currentZone = String(shot.shot_zone || '').toLowerCase();
    if (currentZone === 'deep top 3') shot.shot_zone = 'top 3';
    if (['midrange', 'long midrange', 'left midrange', 'middle midrange', 'right midrange'].includes(currentZone) && nonEmpty(shot.shot_x) && nonEmpty(shot.shot_y)) {
      const z = zoneFromXY(shot.shot_x, shot.shot_y);
      shot.shot_zone = z.zone;
      shot.approx_distance_m = z.dist;
    }
  });

  const seasonMap = new Map();
  (data.seasons || []).forEach(season => {
    if (season?.season_id) seasonMap.set(season.season_id, season);
  });
  data.games.forEach(game => {
    if (game.season_id && !seasonMap.has(game.season_id)) {
      seasonMap.set(game.season_id, { season_id: game.season_id, label: game.season_id });
    }
  });
  data.seasons = Array.from(seasonMap.values()).sort((a, b) => String(a.season_id).localeCompare(String(b.season_id)));
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

export function getSeasons(data) {
  data = normalizeData(data);
  return (data.seasons || []).map(s => s.season_id || s.label).filter(Boolean);
}

export function getGames(data, seasonId = 'ALL') {
  data = normalizeData(data);
  return (data.games || [])
    .filter(game => seasonId === 'ALL' || game.season_id === seasonId)
    .map(game => game.game_id)
    .filter(Boolean);
}

export function gameSeason(data, gameId) {
  const game = (data.games || []).find(g => String(g.game_id) === String(gameId));
  return game?.season_id || seasonFromGameId(gameId)?.season_id || '';
}

export function gameRecord(data, gameId) {
  data = normalizeData(data);
  return (data.games || []).find(g => String(g.game_id) === String(gameId)) || null;
}

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

export function rowCount(row) {
  return num(row?.count) || 1;
}

export function sum(rows, getter) {
  return (rows || []).reduce((total, row) => total + num(getter(row)), 0);
}

export function countEvents(events, type, subtype = null) {
  return sum(events, event =>
    (type && event.event_type !== type) ? 0 :
    (subtype && event.event_subtype !== subtype) ? 0 : rowCount(event)
  );
}

export function eventPoints(events, type, subtype = null) {
  return sum(events, event =>
    (type && event.event_type !== type) ? 0 :
    (subtype && event.event_subtype !== subtype) ? 0 : event.points_created
  );
}

export function shotPoints(shots) {
  return sum(shots, shot => made(shot) ? shot.points : 0);
}

export function fgStats(shots = []) {
  const madeShots = shots.filter(made);
  const FGA = shots.length;
  const FGM = madeShots.length;
  const twoPA = shots.filter(s => num(s.points) === 2).length;
  const twoPM = madeShots.filter(s => num(s.points) === 2).length;
  const threePA = shots.filter(s => num(s.points) === 3).length;
  const threePM = madeShots.filter(s => num(s.points) === 3).length;
  return {
    FGM, FGA, FG_pct: safe(FGM, FGA),
    twoPM, twoPA, twoP_pct: safe(twoPM, twoPA),
    threePM, threePA, threeP_pct: safe(threePM, threePA),
    shot_points: shotPoints(shots),
    eFG_pct: safe(FGM + 0.5 * threePM, FGA)
  };
}

export function ftStats(freeThrows = []) {
  const FTA = freeThrows.length;
  const FTM = freeThrows.filter(made).length;
  return { FTM, FTA, FT_pct: safe(FTM, FTA), ft_points: FTM };
}

export function onCourtStats(data, player, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const stints = filterRows(data, data.lineupStints, f)
    .filter(stint => [stint.player_1, stint.player_2, stint.player_3, stint.player_4, stint.player_5].includes(player));
  const pointsFor = sum(stints, s => s.points_for);
  const pointsAgainst = sum(stints, s => s.points_against);
  const offPoss = sum(stints, s => s.off_poss);
  const defPoss = sum(stints, s => s.def_poss);
  const offRtg = safe(pointsFor * 100, offPoss);
  const defRtg = safe(pointsAgainst * 100, defPoss);
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

function statsFrom(data, shots, freeThrows, events, lineupStints, allShots = null, player = null, filters = {}) {
  allShots ||= shots;
  const fg = fgStats(shots);
  const ft = ftStats(freeThrows);
  const PTS = fg.shot_points + ft.ft_points;
  const TOV = countEvents(events, 'turnover');
  const Poss_Used = fg.FGA + 0.44 * ft.FTA + TOV;
  const assistedFGM = shots.filter(s => made(s) && nonEmpty(s.assisted_by)).length;
  const unassistedFGM = fg.FGM - assistedFGM;
  const assistRows = player
    ? allShots.filter(s => made(s) && s.assisted_by === player)
    : shots.filter(s => made(s) && nonEmpty(s.assisted_by));

  const AST = assistRows.length;
  const AST_PTS = shotPoints(assistRows);
  const potentialAST = countEvents(events, 'creation', 'potential_assist');
  const advCreated = sum(events, e => e.event_subtype === 'advantage_created' ? rowCount(e) : 0);
  const advPts = sum(events, e => e.event_subtype === 'advantage_created' ? num(e.points_created) : 0);
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
    PTS,
    ...fg,
    ...ft,
    TS_pct: safe(PTS, 2 * (fg.FGA + 0.44 * ft.FTA)),
    AST,
    AST_PTS,
    AST_Rate: safe(AST, fg.FGM),
    AST_TO: safe(AST, TOV),
    Potential_AST: potentialAST,
    Adv_Created: advCreated,
    Adv_Created_PTS: advPts,
    Paint_Touches_Created: shots.filter(s => yes(s.paint_touch)).length + countEvents(events, 'creation', 'paint_touch_created'),
    Drive_Kick_3PA_Created: shots.filter(s => yes(s.drive_kick) && num(s.points) === 3).length + countEvents(events, 'creation', 'drive_kick_created'),
    Screen_AST: screenAST,
    Screen_AST_PTS: screenASTPts,
    Screen_Created_Opp: screenOpp,
    Screen_Created_Opp_PTS: screenOppPts,
    Screen_Adv: screenAdv,
    Screen_Adv_PTS: screenAdvPts,
    Screen_Created_Total: screenTotal,
    Screen_Created_PTS: screenPts,
    PTS_per_Screen_Created: safe(screenPts, screenTotal),
    OREB,
    DREB,
    REB: OREB + DREB,
    STL,
    BLK,
    DEFLECTION,
    Defensive_Playmaking: STL + BLK + DEFLECTION,
    TOV,
    Fouls: countEvents(events, 'foul'),
    Charges_Drawn: countEvents(events, 'charge_drawn'),
    Poss_Used,
    PTS_per_Poss: safe(PTS, Poss_Used),
    Assisted_FGM: assistedFGM,
    Unassisted_FGM: unassistedFGM,
    Assisted_FG_Rate: safe(assistedFGM, fg.FGM),
    Open_FGA: openShots.length,
    Open_FGM: openShots.filter(made).length,
    Open_PTS: shotPoints(openShots),
    Open_FGA_Rate: safe(openShots.length, fg.FGA),
    Open_PPS: safe(shotPoints(openShots), openShots.length),
    Light_Contest_FGA: lightShots.length,
    Light_Contest_FGM: lightShots.filter(made).length,
    Light_Contest_PTS: shotPoints(lightShots),
    Light_Contest_Rate: safe(lightShots.length, fg.FGA),
    Light_Contest_PPS: safe(shotPoints(lightShots), lightShots.length),
    Bad_Shot_FGA: badShots.length,
    Bad_Shot_FGM: badShots.filter(made).length,
    Bad_Shot_PTS: shotPoints(badShots),
    Bad_Shot_Rate: safe(badShots.length, fg.FGA),
    Bad_Shot_PPS: safe(shotPoints(badShots), badShots.length),
    Transition_FGA: transitionShots.length,
    Transition_FGM: transitionShots.filter(made).length,
    Transition_PTS: shotPoints(transitionShots),
    Transition_PPS: safe(shotPoints(transitionShots), transitionShots.length),
    Lineup_Off_Poss: offPoss,
    Lineup_Def_Poss: defPoss,
    Lineup_PF: lineupPF,
    Lineup_PA: lineupPA,
    Lineup_Net: lineupPF - lineupPA,
    Off_Rtg: offRtg,
    Def_Rtg: defRtg,
    Net_Rtg: offRtg !== null && defRtg !== null ? offRtg - defRtg : null
  };

  if (player) Object.assign(stats, onCourtStats(data, player, filters));
  return stats;
}

export function getTeamStats(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  return statsFrom(
    data,
    filterRows(data, data.shots, f),
    filterRows(data, data.freeThrows, f),
    filterRows(data, data.events, f),
    filterRows(data, data.lineupStints, f),
    null,
    null,
    f
  );
}

export function getPlayerStats(data, player, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters({ ...filters, player });
  const teamFilter = normalizeFilters({ ...filters, player: 'ALL' });
  const lineupStints = filterRows(data, data.lineupStints, teamFilter)
    .filter(stint => [stint.player_1, stint.player_2, stint.player_3, stint.player_4, stint.player_5].includes(player));
  return statsFrom(
    data,
    filterRows(data, data.shots, f),
    filterRows(data, data.freeThrows, f),
    filterRows(data, data.events, f),
    lineupStints,
    filterRows(data, data.shots, teamFilter),
    player,
    teamFilter
  );
}

export function getAllPlayerStats(data, filters = {}) {
  data = normalizeData(data);
  const teamStats = getTeamStats(data, filters);
  return getPlayers(data).map(player => {
    const stats = getPlayerStats(data, player, filters);
    stats.Usage_pct = safe(stats.Poss_Used, teamStats.Poss_Used);
    stats.Creation_Value = num(stats.AST) + num(stats.Potential_AST) + num(stats.Adv_Created) + num(stats.Drive_Kick_3PA_Created);
    stats.Def_Activity = num(stats.STL) + num(stats.BLK) + num(stats.DEFLECTION) + num(stats.Charges_Drawn);
    return stats;
  });
}

export function getLineupStats(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const map = new Map();
  filterRows(data, data.lineupStints, f).forEach(stint => {
    const label = stint.lineup_label || [stint.player_1, stint.player_2, stint.player_3, stint.player_4, stint.player_5].filter(Boolean).join(' / ');
    if (!map.has(label)) {
      map.set(label, { lineup_label: label, stints: 0, points_for: 0, points_against: 0, off_poss: 0, def_poss: 0 });
    }
    const row = map.get(label);
    row.stints += 1;
    row.points_for += num(stint.points_for);
    row.points_against += num(stint.points_against);
    row.off_poss += num(stint.off_poss);
    row.def_poss += num(stint.def_poss);
  });
  return Array.from(map.values()).map(row => {
    row.net_points = row.points_for - row.points_against;
    row.off_rating = safe(row.points_for * 100, row.off_poss);
    row.def_rating = safe(row.points_against * 100, row.def_poss);
    row.net_rating = row.off_rating !== null && row.def_rating !== null ? row.off_rating - row.def_rating : null;
    return row;
  }).sort((a, b) => b.net_points - a.net_points);
}

export function shotBreakdown(shots = [], key = 'shot_zone', buckets = ZONES) {
  return buckets.map(label => {
    const rows = shots.filter(shot => String(shot[key] || '') === label);
    const FGA = rows.length;
    const FGM = rows.filter(made).length;
    const PTS = shotPoints(rows);
    return { label, FGM, FGA, FG_pct: safe(FGM, FGA), rate: safe(FGA, shots.length), PTS, PPS: safe(PTS, FGA) };
  });
}

export function getZoneBreakdown(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  return shotBreakdown(filterRows(data, data.shots, f), 'shot_zone', ZONES);
}

export function getContestBreakdown(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  return shotBreakdown(filterRows(data, data.shots, f), 'contest', CONTESTS);
}

export function getEventBreakdown(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const map = new Map();
  filterRows(data, data.events, f).forEach(event => {
    const key = `${event.event_type || ''}||${event.event_subtype || ''}`;
    if (!map.has(key)) map.set(key, { type: event.event_type || '', subtype: event.event_subtype || '', count: 0, points_created: 0 });
    const row = map.get(key);
    row.count += rowCount(event);
    row.points_created += num(event.points_created);
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count || String(a.type).localeCompare(String(b.type)));
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
  else if (dist < 6.75) zone = x < 5.05 ? 'left midrange' : (x > 9.95 ? 'right midrange' : 'middle midrange');
  else {
    if (y < 3.05 && x < 2.2) zone = 'left corner 3';
    else if (y < 3.05 && x > 12.8) zone = 'right corner 3';
    else if (x < 5.2) zone = 'left wing 3';
    else if (x > 9.8) zone = 'right wing 3';
    else zone = 'top 3';
  }
  return { zone, dist: Math.round(dist * 10) / 10 };
}

export function shotKey(shot) {
  return shot.shot_id || `${shot.game_id || ''}|${shot.half || ''}|${shot.player || ''}|${shot.shot_x || ''}|${shot.shot_y || ''}|${shot.result || ''}|${shot.points || ''}`;
}

export function getShotChartData(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const shots = filterRows(data, data.shots, f);
  return {
    scope: f.player === 'ALL' ? 'team' : 'player',
    shot_count: shots.length,
    shots: shots.map(s => ({
      id: shotKey(s), game_id: s.game_id, half: s.half, player: s.player,
      result: s.result, points: num(s.points), x: num(s.shot_x), y: num(s.shot_y),
      zone: s.shot_zone || '', type: s.shot_type || '', contest: s.contest || '',
      assisted_by: s.assisted_by || '', screen_by: s.screen_assist_by || '', screen_type: s.screen_type || '',
      transition: s.transition || '', paint_touch: s.paint_touch || '', drive_kick: s.drive_kick || '', notes: s.notes || ''
    })),
    zone_breakdown: shotBreakdown(shots, 'shot_zone', ZONES),
    contest_breakdown: shotBreakdown(shots, 'contest', CONTESTS)
  };
}

export function attentionCutoffs(half = 'ALL') {
  const full = String(half || 'ALL') === 'ALL';
  return {
    full,
    turnovers: full ? 10 : 5,
    turnoversMajor: full ? 14 : 7,
    threePA: full ? 12 : 6,
    threePAHigh: full ? 18 : 9,
    fga: full ? 35 : 18,
    openFGA: full ? 10 : 5,
    lightFGA: full ? 10 : 5,
    badFGA: full ? 8 : 4,
    zoneFGA: full ? 3 : 2,
    misses: full ? 20 : 10,
    fta: full ? 6 : 3
  };
}

export function getNeedsAttention(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const team = getTeamStats(data, f);
  const shots = filterRows(data, data.shots, { ...f, player: 'ALL' });
  const events = filterRows(data, data.events, { ...f, player: 'ALL' });
  const freeThrows = filterRows(data, data.freeThrows, { ...f, player: 'ALL' });
  return attentionItems(team, shots, events, freeThrows, f.half);
}

function attentionItems(team, shots, events, freeThrows, half = 'ALL') {
  const c = attentionCutoffs(half);
  const items = [];
  const add = (title, message, priority = 1) => items.push({ title, message, priority });
  const fgText = (m, a) => `${num(m)}/${num(a)}`;
  const threePct = team.threeP_pct;
  const fgPct = team.FG_pct;
  const tov = countEvents(events, 'turnover');
  const poss = num(team.Poss_Used);
  const tovRate = safe(tov, poss);
  const misses = Math.max(0, num(team.FGA) - num(team.FGM));
  const orbRate = safe(num(team.OREB), misses);

  if (team.threePA >= c.threePA && threePct !== null && threePct < 0.30) {
    const volume = team.threePA >= c.threePAHigh ? 'very high volume' : 'high volume';
    add('3PT shooting', `3PT shooting was ${fgText(team.threePM, team.threePA)} (${pctText(threePct)}) on ${volume}.`, 5);
  }
  if (team.FGA >= c.fga && fgPct !== null && fgPct < 0.38) {
    add('Overall efficiency', `Overall FG was ${fgText(team.FGM, team.FGA)} (${pctText(fgPct)}).`, 4);
  }
  if (tov >= c.turnovers || (tov >= Math.max(6, c.turnovers - 2) && tovRate !== null && tovRate >= 0.16)) {
    const severity = tov >= c.turnoversMajor ? 'major' : 'worth flagging';
    add('Turnovers', `Turnovers: ${tov}${tovRate !== null ? ` (${pctText(tovRate)} of used possessions)` : ''}. For 2×20 halves, ${c.turnovers}+ is ${severity}.`, 4);
  }
  const openPct = safe(team.Open_FGM, team.Open_FGA);
  const lightPct = safe(team.Light_Contest_FGM, team.Light_Contest_FGA);
  if (team.Open_FGA >= c.openFGA && openPct !== null && openPct < 0.40) {
    add('Open-shot conversion', `Open looks were ${fgText(team.Open_FGM, team.Open_FGA)} (${pctText(openPct)}), ${round(team.Open_PPS, 2)} PPS.`, 3);
  }
  if (team.Light_Contest_FGA >= c.lightFGA && lightPct !== null && lightPct < 0.35) {
    add('Light-contest conversion', `Light-contest shots were ${fgText(team.Light_Contest_FGM, team.Light_Contest_FGA)} (${pctText(lightPct)}), ${round(team.Light_Contest_PPS, 2)} PPS.`, 2);
  }
  if (team.Bad_Shot_FGA >= c.badFGA && team.Bad_Shot_Rate !== null && team.Bad_Shot_Rate >= 0.20) {
    add('Bad-shot diet', `Bad shots were ${fgText(team.Bad_Shot_FGM, team.Bad_Shot_FGA)} and made up ${pctText(team.Bad_Shot_Rate)} of attempts.`, 3);
  }
  if (team.FTA >= c.fta && team.FT_pct !== null && team.FT_pct < 0.65) {
    add('Free throws', `Free throws were ${fgText(team.FTM, team.FTA)} (${pctText(team.FT_pct)}).`, 2);
  }
  if (misses >= c.misses && orbRate !== null && orbRate < 0.15) {
    add('Offensive glass', `Only ${team.OREB} OREB on ${misses} missed shots (${pctText(orbRate)}).`, 2);
  }
  const zones = shotBreakdown(shots, 'shot_zone', ZONES)
    .filter(zone => zone.FGA >= c.zoneFGA && ((zone.FG_pct !== null && zone.FG_pct < 0.30) || (zone.PPS !== null && zone.PPS < 0.75)))
    .sort((a, b) => (b.FGA - a.FGA) || (num(a.PPS) - num(b.PPS)))
    .slice(0, 3);
  if (zones.length) {
    add('Cold zones', zones.map(z => `${z.label}: ${z.FGM}/${z.FGA}, ${round(z.PPS, 2)} PPS`).join('; '), 2);
  }
  const rimPaint = shots.filter(s => ['rim', 'paint'].includes(s.shot_zone));
  const rpFGA = rimPaint.length;
  const rpFGM = rimPaint.filter(made).length;
  const rpPct = safe(rpFGM, rpFGA);
  if (rpFGA >= c.zoneFGA + 2 && rpPct !== null && rpPct < 0.45) {
    add('Paint/rim finishing', `Rim/paint finishing was ${fgText(rpFGM, rpFGA)} (${pctText(rpPct)}).`, 3);
  }
  return items.sort((a, b) => b.priority - a.priority).slice(0, 8);
}

export function statLine(stats) {
  return { made: num(stats.FGM), attempted: num(stats.FGA), pct: pctValue(stats.FG_pct), display: `${num(stats.FGM)}/${num(stats.FGA)} (${pctText(stats.FG_pct)})` };
}

export function threeLine(stats) {
  return { made: num(stats.threePM), attempted: num(stats.threePA), pct: pctValue(stats.threeP_pct), display: `${num(stats.threePM)}/${num(stats.threePA)} (${pctText(stats.threeP_pct)})` };
}

export function ftLine(stats) {
  return { made: num(stats.FTM), attempted: num(stats.FTA), pct: pctValue(stats.FT_pct), display: `${num(stats.FTM)}/${num(stats.FTA)} (${pctText(stats.FT_pct)})` };
}

export function compactStats(stats) {
  return {
    player: stats.player || 'TEAM',
    PTS: num(stats.PTS),
    FG: statLine(stats),
    twoPoint: { made: num(stats.twoPM), attempted: num(stats.twoPA), pct: pctValue(stats.twoP_pct), display: `${num(stats.twoPM)}/${num(stats.twoPA)} (${pctText(stats.twoP_pct)})` },
    threePoint: threeLine(stats),
    FT: ftLine(stats),
    eFG_pct: pctValue(stats.eFG_pct),
    TS_pct: pctValue(stats.TS_pct),
    AST: num(stats.AST),
    AST_PTS: num(stats.AST_PTS),
    AST_Rate_pct: pctValue(stats.AST_Rate),
    AST_TO: stats.AST_TO === null ? null : round(stats.AST_TO, 2),
    Extra_Potential_AST: num(stats.Potential_AST),
    Advantage_Created: num(stats.Adv_Created),
    Advantage_Created_PTS: num(stats.Adv_Created_PTS),
    Paint_Touches_Created: num(stats.Paint_Touches_Created),
    Drive_Kick_3PA_Created: num(stats.Drive_Kick_3PA_Created),
    Screen_AST: num(stats.Screen_AST),
    Screen_AST_PTS: num(stats.Screen_AST_PTS),
    Screen_Opportunity_Created: num(stats.Screen_Created_Opp),
    Screen_Advantage_Created: num(stats.Screen_Adv),
    Screen_Opp_AST_Created: num(stats.Screen_Created_Total),
    Screen_Created_PTS: num(stats.Screen_Created_PTS),
    PTS_per_Screen_Created: stats.PTS_per_Screen_Created === null ? null : round(stats.PTS_per_Screen_Created, 2),
    OREB: num(stats.OREB),
    DREB: num(stats.DREB),
    REB: num(stats.REB),
    STL: num(stats.STL),
    BLK: num(stats.BLK),
    Deflections: num(stats.DEFLECTION),
    Defensive_Playmaking: num(stats.Defensive_Playmaking),
    TOV: num(stats.TOV),
    Fouls: num(stats.Fouls),
    Charges_Drawn: num(stats.Charges_Drawn),
    Poss_Used: round(stats.Poss_Used, 2),
    Usage_pct: pctValue(stats.Usage_pct),
    PTS_per_Poss: stats.PTS_per_Poss === null ? null : round(stats.PTS_per_Poss, 2),
    Open_Shot_Rate_pct: pctValue(stats.Open_FGA_Rate),
    Light_Contest_Shot_Rate_pct: pctValue(stats.Light_Contest_Rate),
    Bad_Shot_Rate_pct: pctValue(stats.Bad_Shot_Rate),
    Transition_PTS: num(stats.Transition_PTS),
    Assisted_FGM: num(stats.Assisted_FGM),
    Unassisted_FGM: num(stats.Unassisted_FGM),
    Assisted_FG_Rate_pct: pctValue(stats.Assisted_FG_Rate),
    Player_plus_minus: stats.Player_plus_minus ?? stats.Lineup_Net ?? 0,
    Off_Rtg: stats.Off_Rtg === null ? null : round(stats.Off_Rtg, 1),
    Def_Rtg: stats.Def_Rtg === null ? null : round(stats.Def_Rtg, 1),
    Net_Rtg: stats.Net_Rtg === null ? null : round(stats.Net_Rtg, 1)
  };
}

export function playerTableRow(stats) {
  return {
    player: stats.player || '',
    PTS: num(stats.PTS),
    Usage_pct: pctValue(stats.Usage_pct),
    FG: statLine(stats),
    threePoint: threeLine(stats),
    FT: ftLine(stats),
    AST: num(stats.AST),
    Extra_Potential_AST: num(stats.Potential_AST),
    Advantage_Created: num(stats.Adv_Created),
    Screen_Opp_AST_Created: num(stats.Screen_Created_Total),
    REB: num(stats.REB),
    STL: num(stats.STL),
    BLK: num(stats.BLK),
    Deflections: num(stats.DEFLECTION),
    TOV: num(stats.TOV),
    Open_Shot_Rate_pct: pctValue(stats.Open_FGA_Rate),
    Light_Contest_Shot_Rate_pct: pctValue(stats.Light_Contest_Rate),
    Bad_Shot_Rate_pct: pctValue(stats.Bad_Shot_Rate),
    plus_minus: stats.Player_plus_minus ?? 0,
    raw_stats: compactStats(stats)
  };
}

export function leaderboardRows(players, key, limit = 5, min = 1) {
  return players
    .filter(player => num(player[key]) >= min)
    .sort((a, b) => num(b[key]) - num(a[key]))
    .slice(0, limit)
    .map(player => ({ player: player.player, value: num(player[key]) }));
}

export function getGameReport(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizeFilters(filters);
  const team = getTeamStats(data, f);
  const players = getAllPlayerStats(data, f);
  const selectedPlayerStats = f.player === 'ALL' ? null : getPlayerStats(data, f.player, f);
  if (selectedPlayerStats) selectedPlayerStats.Usage_pct = safe(selectedPlayerStats.Poss_Used, team.Poss_Used);

  const teamFilter = { ...f, player: 'ALL' };
  const teamShots = filterRows(data, data.shots, teamFilter);
  const teamEvents = filterRows(data, data.events, teamFilter);
  const teamFreeThrows = filterRows(data, data.freeThrows, teamFilter);
  const viewFilter = f.player === 'ALL' ? teamFilter : f;
  const viewShots = filterRows(data, data.shots, viewFilter);
  const viewEvents = filterRows(data, data.events, viewFilter);
  const viewFreeThrows = filterRows(data, data.freeThrows, viewFilter);
  const game = f.gameId === 'ALL' ? null : gameRecord(data, f.gameId);
  const lineupRows = getLineupStats(data, f);
  const bestNet = lineupRows.slice().sort((a, b) => num(b.net_points) - num(a.net_points))[0] || null;
  const worstNet = lineupRows.slice().sort((a, b) => num(a.net_points) - num(b.net_points))[0] || null;
  const bestRtg = lineupRows.slice().filter(row => row.off_poss || row.def_poss).sort((a, b) => num(b.net_rating) - num(a.net_rating))[0] || bestNet;

  const seasonGames = (data.games || [])
    .filter(g => f.seasonId === 'ALL' || g.season_id === f.seasonId)
    .map(g => ({ game_id: g.game_id, season_id: g.season_id, date: g.date || '', opponent: g.opponent || '', team_score: g.team_score, opponent_score: g.opponent_score, result: g.result || '' }));

  return {
    schema: 'spartans-report-object',
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    team_name: data.team?.name || 'Spartans',
    filters: { season_id: f.seasonId, game_id: f.gameId, half: f.half, player: f.player },
    game: game ? { game_id: game.game_id, season_id: game.season_id, date: game.date || '', opponent: game.opponent || '', team_score: game.team_score, opponent_score: game.opponent_score, result: game.result || '', notes: game.notes || '' } : null,
    index: { seasons: data.seasons || [], games: seasonGames, players: getPlayers(data) },
    team_summary: { ...compactStats(team), score: game ? { team: team.PTS || game.team_score || 0, opponent: game.opponent_score ?? null, result: game.result || '' } : null },
    selected_player: selectedPlayerStats ? compactStats(selectedPlayerStats) : null,
    all_players_advanced_table: players.map(playerTableRow),
    leaders: {
      top_scorers: leaderboardRows(players, 'PTS'),
      top_creators: leaderboardRows(players, 'Creation_Value'),
      best_screeners: leaderboardRows(players, 'Screen_Created_Total'),
      top_rebounders: leaderboardRows(players, 'REB'),
      defensive_activity: leaderboardRows(players, 'Def_Activity')
    },
    needs_attention: getNeedsAttention(data, f),
    half_splits: ['1H', '2H', 'OT']
      .map(half => ({ half, team_summary: compactStats(getTeamStats(data, { ...f, half, player: 'ALL' })) }))
      .filter(row => row.team_summary.PTS || row.team_summary.FG.attempted || row.team_summary.FT.attempted || row.team_summary.AST || row.team_summary.TOV || row.team_summary.REB),
    shot_chart: {
      scope: f.player === 'ALL' ? 'team' : 'player',
      ...getShotChartData(data, viewFilter)
    },
    events: { scope: f.player === 'ALL' ? 'team' : 'player', event_count: viewEvents.length, breakdown: getEventBreakdown(data, viewFilter), rows: viewEvents },
    free_throws: { scope: f.player === 'ALL' ? 'team' : 'player', count: viewFreeThrows.length, rows: viewFreeThrows },
    creation_leaders: players.slice().sort((a, b) => (b.AST + b.Potential_AST + b.Adv_Created) - (a.AST + a.Potential_AST + a.Adv_Created)).map(s => ({
      player: s.player, AST: s.AST, AST_PTS: s.AST_PTS, Extra_Potential_AST: s.Potential_AST,
      Advantage_Created: s.Adv_Created, Advantage_Created_PTS: s.Adv_Created_PTS,
      Paint_Touches_Created: s.Paint_Touches_Created, Drive_Kick_3PA_Created: s.Drive_Kick_3PA_Created,
      AST_TO: s.AST_TO
    })),
    screen_leaders: players.slice().sort((a, b) => b.Screen_Created_Total - a.Screen_Created_Total).map(s => ({
      player: s.player, Screen_AST: s.Screen_AST, Screen_Opportunity_Created: s.Screen_Created_Opp,
      Screen_Advantage_Created: s.Screen_Adv, Screen_Opp_AST_Created: s.Screen_Created_Total,
      Screen_Created_PTS: s.Screen_Created_PTS, PTS_per_Screen_Created: s.PTS_per_Screen_Created
    })),
    lineup_impact: { cards: { best_plus_minus: bestNet, worst_plus_minus: worstNet, best_net_rating: bestRtg }, rows: lineupRows },
    report_notes: (data.reportNotes || {})[`${f.gameId || 'ALL'}|${f.half || 'ALL'}`] || '',
    raw_filtered_rows: { team_shots: teamShots, team_events: teamEvents, team_free_throws: teamFreeThrows, lineup_stints: filterRows(data, data.lineupStints, teamFilter) }
  };
}

export function getSeasonReport(data, seasonId, extraFilters = {}) {
  return getGameReport(data, { ...extraFilters, seasonId, gameId: 'ALL' });
}

export function getPlayerReport(data, player, filters = {}) {
  return getGameReport(data, { ...filters, player });
}

export function getGameReports(data, seasonId = 'ALL') {
  data = normalizeData(data);
  return getGames(data, seasonId).map(gameId => getGameReport(data, { seasonId: seasonId === 'ALL' ? gameSeason(data, gameId) : seasonId, gameId, half: 'ALL', player: 'ALL' }));
}

export default {
  ZONES, CONTESTS, SHOT_TYPES,
  normalizeData, normalizeFilters, seasonFromGameId, getPlayers, getSeasons, getGames, gameRecord,
  filterRows, fgStats, ftStats, getTeamStats, getPlayerStats, getAllPlayerStats, onCourtStats,
  getLineupStats, getZoneBreakdown, getContestBreakdown, getEventBreakdown, getShotChartData,
  getNeedsAttention, getGameReport, getSeasonReport, getPlayerReport, getGameReports,
  zoneFromXY, shotKey, compactStats, playerTableRow, leaderboardRows, pctValue, pctText
};
