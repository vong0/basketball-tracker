// Spartans Website API v0.5.7
// Friendly wrapper around spartans-stats-core.js for the website pages and the new Advanced Stats hub.

import SpartansStats, {
  normalizeData,
  normalizeFilters,
  getGameReport,
  getPlayerAdvancedTabs,
  getGames,
  getPlayers,
  getSeasons,
  getPlayerProfile,
  getTeamStats,
  getPlayerStats,
  getAllPlayerStats,
  getAllPlayersAdvancedTable,
  getTeamAdvancedStats,
  getStatLeaders,
  getShotChartData,
  getZoneBreakdown,
  getContestBreakdown,
  getLineupStats,
  filterRows,
  compactStats,
  pctValue,
  pctText,
  ratioText,
  round,
  safe,
  num
} from './spartans-stats-core.js';

export function getWebsiteIndex(data) {
  data = normalizeData(data);
  return {
    team: data.team || { name: 'Spartans' },
    seasons: data.seasons || [],
    games: data.games || [],
    players: getPlayers(data).map(name => getPlayerProfile(data, name)),
    opponents: data.opponents || [],
    strategies: data.strategies || []
  };
}

export function getGamePageTabs(data, { seasonId = 'ALL', gameId, half = 'ALL', player = 'ALL' } = {}) {
  const report = getGameReport(data, { seasonId, gameId, half, player });
  return {
    game: report.game,
    filters: report.filters,
    tabs: {
      overview: report.overview,
      advanced_box_score: {
        table: report.all_players_advanced_table,
        columns: [
          'player','PTS','Usage_pct','FG','threePoint','FT','TS_pct','AST','TOV','AST_TO',
          'Extra_Potential_AST','Created_Paint_Touch_Drive_Kick_Adv','Screen_ADV_OPP_AST',
          'OR','DR','STL','BLK','Deflections','Bad_Shot_Rate_pct','plus_minus'
        ]
      },
      stat_leaders: report.stat_leaders,
      team_summary: report.team_summary,
      shot_chart_quality: report.shot_chart_quality,
      team_advanced_stats: report.team_advanced_stats
    },
    full_report_object: report
  };
}

export function getPlayerPageTabs(data, { player, seasonId = 'ALL', gameId = 'ALL', half = 'ALL' } = {}) {
  if (!player) throw new Error('getPlayerPageTabs requires a player name');
  const playerReport = getPlayerAdvancedTabs(data, player, { seasonId, gameId, half });
  return {
    player: playerReport.player,
    filters: playerReport.filters,
    tabs: {
      scoring: playerReport.scoring,
      creation_passing: playerReport.creation_passing,
      screening: playerReport.screening,
      rebounding_defense: playerReport.rebounding_defense,
      lineup_impact: playerReport.lineup_impact
    },
    full_player_object: playerReport
  };
}

export function getAllGamePages(data, seasonId = 'ALL') {
  return getGames(data, seasonId).map(game => getGamePageTabs(data, {
    seasonId: game.season_id || 'ALL',
    gameId: game.game_id,
    half: 'ALL',
    player: 'ALL'
  }));
}

export function getAllPlayerPages(data, filters = {}) {
  return getPlayers(data).map(player => getPlayerPageTabs(data, { ...filters, player }));
}

function normalizedAdvancedFilters(filters = {}) {
  const f = normalizeFilters(filters);
  return {
    seasonId: f.seasonId,
    gameId: f.gameId,
    half: f.half,
    view: filters.view || filters.scope || 'team', // team, players, player
    player: filters.player || f.player || 'ALL',
    mode: filters.mode || 'perGame' // perGame or totals
  };
}

function gameIdsForAdvanced(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizedAdvancedFilters(filters);
  if (f.gameId !== 'ALL') return [f.gameId];
  const player = f.view === 'player' && f.player !== 'ALL' ? f.player : 'ALL';
  const ids = new Set();
  const addRows = rows => filterRows(data, rows || [], { seasonId: f.seasonId, gameId: 'ALL', half: f.half, player }).forEach(row => row.game_id && ids.add(row.game_id));
  addRows(data.shots);
  addRows(data.freeThrows);
  addRows(data.events);
  (data.lineupStints || []).forEach(row => {
    if (f.seasonId !== 'ALL' && !String(row.game_id || '').startsWith(String(f.seasonId))) return;
    if (f.half !== 'ALL' && String(row.half) !== String(f.half)) return;
    if (player !== 'ALL' && ![row.player_1,row.player_2,row.player_3,row.player_4,row.player_5].includes(player)) return;
    if (row.game_id) ids.add(row.game_id);
  });
  if (!ids.size) {
    (data.games || []).forEach(game => {
      if (f.seasonId === 'ALL' || game.season_id === f.seasonId) ids.add(game.game_id);
    });
  }
  return Array.from(ids).filter(Boolean);
}

function gameCount(data, filters = {}) {
  return Math.max(1, gameIdsForAdvanced(data, filters).length);
}

function countMetric(total, gp, mode = 'perGame', digits = 1) {
  const t = num(total);
  const per = safe(t, gp);
  const perRounded = per === null ? null : round(per, digits);
  return {
    total: t,
    per_game: perRounded,
    mode,
    main: mode === 'perGame' ? perRounded : t,
    secondary: mode === 'perGame' ? `${t} total` : `${perRounded}/g`,
    display: mode === 'perGame' ? `${perRounded}` : `${t}`
  };
}

function ratioMetric(made, attempted, pctRaw = null) {
  return {
    made: num(made),
    attempted: num(attempted),
    pct: pctValue(pctRaw ?? safe(made, attempted)),
    pct_raw: pctRaw ?? safe(made, attempted),
    display: ratioText(made, attempted, pctRaw ?? safe(made, attempted))
  };
}

function rateMetric(value) {
  return { pct: pctValue(value), pct_raw: value, display: pctText(value) };
}

function withCountDisplays(raw, gp, mode) {
  return {
    PTS: countMetric(raw.PTS, gp, mode),
    AST: countMetric(raw.AST, gp, mode),
    AST_PTS: countMetric(raw.AST_PTS, gp, mode),
    TOV: countMetric(raw.TOV, gp, mode),
    OR: countMetric(raw.OREB, gp, mode),
    DR: countMetric(raw.DREB, gp, mode),
    REB: countMetric(raw.REB, gp, mode),
    STL: countMetric(raw.STL, gp, mode),
    BLK: countMetric(raw.BLK, gp, mode),
    Deflections: countMetric(raw.DEFLECTION, gp, mode),
    Def_Activity: countMetric(raw.Def_Activity ?? raw.Defensive_Playmaking, gp, mode),
    Fouls: countMetric(raw.Fouls, gp, mode),
    Charges: countMetric(raw.Charges_Drawn, gp, mode),
    Extra_Potential_AST: countMetric(raw.Potential_AST, gp, mode),
    ADV_Created: countMetric(raw.Adv_Created, gp, mode),
    Paint_Touch_Created: countMetric(raw.Paint_Touches_Created, gp, mode),
    Drive_Kick_Created: countMetric(raw.Drive_Kick_3PA_Created ?? raw.Drive_Kick_Created, gp, mode),
    Created_Paint_Touch_Drive_Kick_Adv: countMetric(raw.Created_Paint_Drive_Adv ?? (num(raw.Adv_Created)+num(raw.Paint_Touches_Created)+num(raw.Drive_Kick_3PA_Created ?? raw.Drive_Kick_Created)), gp, mode),
    Screen_AST: countMetric(raw.Screen_AST, gp, mode),
    Screen_Opp_Created: countMetric(raw.Screen_Created_Opp, gp, mode),
    Screen_Adv_Created: countMetric(raw.Screen_Adv, gp, mode),
    Screen_ADV_OPP_AST: countMetric(raw.Screen_Created_Total, gp, mode),
    Screen_PTS: countMetric(raw.Screen_Created_PTS, gp, mode)
  };
}

function advancedBoxRowFromStats(raw, gp, mode) {
  return {
    player: raw.player || 'TEAM',
    GP: gp,
    values: withCountDisplays(raw, gp, mode),
    Usage_pct: pctValue(raw.Usage_pct),
    Poss_Used: round(raw.Poss_Used, 1),
    FG: ratioMetric(raw.FGM, raw.FGA, raw.FG_pct),
    threePoint: ratioMetric(raw.threePM, raw.threePA, raw.threeP_pct),
    FT: ratioMetric(raw.FTM, raw.FTA, raw.FT_pct),
    TS_pct: pctValue(raw.TS_pct),
    AST_TO: raw.AST_TO === null ? null : round(raw.AST_TO, 2),
    Bad_Shot_Rate_pct: pctValue(raw.Bad_Shot_Rate),
    plus_minus: raw.Player_plus_minus ?? raw.Lineup_Net ?? 0,
    raw_stats: compactStats(raw)
  };
}

function leaderboardTables(players, data, filters) {
  const f = normalizedAdvancedFilters(filters);
  const mode = f.mode;
  const row = s => advancedBoxRowFromStats(s, gameCount(data, { ...f, view: 'player', player: s.player }), mode);
  const decorated = players.map(s => ({ raw: s, row: row(s) }));
  return {
    scoring: decorated.slice().filter(x => num(x.raw.PTS) || num(x.raw.FGA)).sort((a,b) => num(b.raw.PTS)-num(a.raw.PTS)).map(x => x.row),
    creation_passing: decorated.slice().sort((a,b) => num(b.raw.Creation_Value)-num(a.raw.Creation_Value)).map(x => x.row),
    screening: decorated.slice().sort((a,b) => num(b.raw.Screen_Created_Total)-num(a.raw.Screen_Created_Total)).map(x => x.row),
    rebounding_defense: decorated.slice().sort((a,b) => (num(b.raw.REB)+num(b.raw.Def_Activity))-(num(a.raw.REB)+num(a.raw.Def_Activity))).map(x => x.row)
  };
}

function categoryObject(raw, gp, mode) {
  const counts = withCountDisplays(raw, gp, mode);
  return {
    scoring_efficiency: {
      PTS: counts.PTS,
      FG: ratioMetric(raw.FGM, raw.FGA, raw.FG_pct),
      twoPoint: ratioMetric(raw.twoPM, raw.twoPA, raw.twoP_pct),
      threePoint: ratioMetric(raw.threePM, raw.threePA, raw.threeP_pct),
      FT: ratioMetric(raw.FTM, raw.FTA, raw.FT_pct),
      eFG_pct: rateMetric(raw.eFG_pct),
      TS_pct: rateMetric(raw.TS_pct),
      PTS_per_Poss: raw.PTS_per_Poss === null ? null : round(raw.PTS_per_Poss, 2),
      Usage_pct: rateMetric(raw.Usage_pct)
    },
    creation_passing: {
      AST: counts.AST,
      AST_PTS: counts.AST_PTS,
      AST_Rate: rateMetric(raw.AST_Rate),
      AST_TO: raw.AST_TO === null ? null : round(raw.AST_TO, 2),
      Extra_Potential_AST: counts.Extra_Potential_AST,
      ADV_Created: counts.ADV_Created,
      Paint_Touch_Created: counts.Paint_Touch_Created,
      Drive_Kick_Created: counts.Drive_Kick_Created,
      Created_Paint_Touch_Drive_Kick_Adv: counts.Created_Paint_Touch_Drive_Kick_Adv
    },
    screening: {
      Screen_AST: counts.Screen_AST,
      Screen_Opp_Created: counts.Screen_Opp_Created,
      Screen_Adv_Created: counts.Screen_Adv_Created,
      Screen_ADV_OPP_AST: counts.Screen_ADV_OPP_AST,
      Screen_PTS: counts.Screen_PTS,
      PTS_per_Screen: raw.PTS_per_Screen_Created === null ? null : round(raw.PTS_per_Screen_Created, 2)
    },
    rebounding_defense: {
      OR: counts.OR,
      DR: counts.DR,
      REB: counts.REB,
      STL: counts.STL,
      BLK: counts.BLK,
      Deflections: counts.Deflections,
      Charges: counts.Charges,
      Fouls: counts.Fouls,
      Def_Activity: counts.Def_Activity,
      plus_minus: raw.Player_plus_minus ?? raw.Lineup_Net ?? 0
    }
  };
}

export function getAdvancedStatsHub(data, filters = {}) {
  data = normalizeData(data);
  const f = normalizedAdvancedFilters(filters);
  const playerScope = f.view === 'player' && f.player !== 'ALL';
  const scopePlayer = playerScope ? f.player : 'ALL';
  const scopeFilters = { seasonId: f.seasonId, gameId: f.gameId, half: f.half, player: scopePlayer };
  const teamFilters = { seasonId: f.seasonId, gameId: f.gameId, half: f.half, player: 'ALL' };
  const gp = gameCount(data, { ...f, player: scopePlayer });
  const teamRaw = getTeamStats(data, teamFilters);
  let scopeRaw = playerScope ? getPlayerStats(data, f.player, scopeFilters) : teamRaw;
  if (playerScope) scopeRaw.Usage_pct = safe(scopeRaw.Poss_Used, teamRaw.Poss_Used);
  const allPlayersRaw = getAllPlayerStats(data, teamFilters);
  const allPlayersRows = allPlayersRaw.map(s => advancedBoxRowFromStats(s, gameCount(data, { ...f, view:'player', player:s.player }), f.mode));
  const leaderboards = leaderboardTables(allPlayersRaw, data, f);
  const shotFilters = { ...scopeFilters };
  const shotChartQuality = {
    shot_chart: getShotChartData(data, shotFilters),
    zone_breakdown: getZoneBreakdown(data, shotFilters),
    contest_breakdown: getContestBreakdown(data, shotFilters),
    shot_quality_summary: {
      Open_Shot_Rate: rateMetric(scopeRaw.Open_FGA_Rate),
      Light_Contest_Shot_Rate: rateMetric(scopeRaw.Light_Contest_Rate),
      Bad_Shot_Rate: rateMetric(scopeRaw.Bad_Shot_Rate),
      Assisted_FG_Rate: rateMetric(scopeRaw.Assisted_FG_Rate),
      Open_PPS: scopeRaw.Open_PPS === null ? null : round(scopeRaw.Open_PPS, 2),
      Light_Contest_PPS: scopeRaw.Light_Contest_PPS === null ? null : round(scopeRaw.Light_Contest_PPS, 2),
      Bad_Shot_PPS: scopeRaw.Bad_Shot_PPS === null ? null : round(scopeRaw.Bad_Shot_PPS, 2)
    }
  };
  return {
    schema: 'spartans-advanced-stats-hub',
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    filters: { season_id: f.seasonId, game_id: f.gameId, half: f.half, view: f.view, player: f.player, mode: f.mode },
    display: {
      game_count: gp,
      is_average_mode: f.mode === 'perGame' && f.gameId === 'ALL',
      average_title_suffix: f.mode === 'perGame' && f.gameId === 'ALL' ? ' (averages)' : '',
      count_rule: f.mode === 'perGame' ? 'counting stats return per-game as main value, total as secondary' : 'counting stats return totals as main value, per-game as secondary'
    },
    index: { seasons: getSeasons(data), games: getGames(data, f.seasonId), players: getPlayers(data) },
    tabs: {
      overview: {
        scope: playerScope ? 'player' : f.view === 'players' ? 'players' : 'team',
        scope_label: playerScope ? f.player : f.view === 'players' ? 'All players comparison' : 'Team',
        game_count: gp,
        kpis: categoryObject(scopeRaw, gp, f.mode),
        raw_stats: compactStats(scopeRaw),
        leader_cards: getGameReport(data, teamFilters).overview.leader_cards
      },
      advanced_box_score: {
        title: `Advanced box score${f.mode === 'perGame' && f.gameId === 'ALL' ? ' (averages)' : ''}`,
        columns: ['player','GP','PTS','Usage_pct','FG','threePoint','FT','TS_pct','AST','Extra_Potential_AST','Created_Paint_Touch_Drive_Kick_Adv','Screen_ADV_OPP_AST','OR','DR','STL','BLK','Deflections','TOV','AST_TO','Bad_Shot_Rate_pct','plus_minus'],
        rows: allPlayersRows
      },
      player_leaderboards: playerScope ? null : {
        title: `Player leaderboards${f.mode === 'perGame' && f.gameId === 'ALL' ? ' (averages)' : ''}`,
        scoring: leaderboards.scoring,
        creation_passing: leaderboards.creation_passing,
        screening: leaderboards.screening,
        rebounding_defense: leaderboards.rebounding_defense
      },
      team_advanced_stats: {
        title: `${playerScope ? 'Player' : 'Team'} advanced stats${f.mode === 'perGame' && f.gameId === 'ALL' ? ' (averages)' : ''}`,
        groups: categoryObject(scopeRaw, gp, f.mode)
      },
      shot_chart_quality: shotChartQuality,
      creation_passing: playerScope || f.view === 'team' ? categoryObject(scopeRaw, gp, f.mode).creation_passing : { rows: leaderboards.creation_passing },
      screening: playerScope || f.view === 'team' ? categoryObject(scopeRaw, gp, f.mode).screening : { rows: leaderboards.screening },
      rebounding_defense: playerScope || f.view === 'team' ? categoryObject(scopeRaw, gp, f.mode).rebounding_defense : { rows: leaderboards.rebounding_defense },
      lineup_impact: {
        rows: getLineupStats(data, teamFilters),
        note: 'Lineup impact is team-level by filter. For player pages, use getPlayerPageTabs(...).tabs.lineup_impact for player on-court impact.'
      }
    }
  };
}

export default {
  ...SpartansStats,
  getWebsiteIndex,
  getGamePageTabs,
  getPlayerPageTabs,
  getAllGamePages,
  getAllPlayerPages,
  getAdvancedStatsHub
};
